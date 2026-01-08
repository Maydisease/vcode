import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FileNode } from '../types';

interface ProjectStore {
    files: FileNode[];
    activeFileId: string | null;
    openTabs: string[];

    // Diff view state
    diffViewFileId: string | null;

    // Source state
    projectSource: 'generator' | 'history';

    // Actions
    setFiles: (files: FileNode[]) => void;
    addFile: (file: FileNode) => void;
    setProjectSource: (source: 'generator' | 'history') => void;
    updateFileContent: (fileId: string, content: string) => void;
    deleteFile: (fileId: string) => void;
    setActiveFile: (fileId: string | null) => void;
    openTab: (fileId: string) => void;
    closeTab: (fileId: string) => void;
    closeOtherTabs: (fileId: string) => void;
    closeAllTabs: () => void;
    closeTabsToRight: (fileId: string) => void;
    clearProject: () => void;

    // Version management
    addFileVersion: (fileId: string, label: string, content: string) => void;
    openDiffView: (fileId: string) => void;
    closeDiffView: () => void;

    // Helpers
    getFileById: (fileId: string) => FileNode | undefined;
    getActiveFile: () => FileNode | undefined;
}

// Helper to find file by ID in nested structure
function findFileById(files: FileNode[], id: string): FileNode | undefined {
    for (const file of files) {
        if (file.id === id) return file;
        if (file.children) {
            const found = findFileById(file.children, id);
            if (found) return found;
        }
    }
    return undefined;
}

// Helper to update file content in nested structure
function updateFileInTree(files: FileNode[], id: string, content: string): FileNode[] {
    return files.map(file => {
        if (file.id === id) {
            return { ...file, content };
        }
        if (file.children) {
            return { ...file, children: updateFileInTree(file.children, id, content) };
        }
        return file;
    });
}

// Helper to delete file from nested structure
function deleteFileFromTree(files: FileNode[], id: string): FileNode[] {
    return files
        .filter(file => file.id !== id)
        .map(file => {
            if (file.children) {
                return { ...file, children: deleteFileFromTree(file.children, id) };
            }
            return file;
        });
}

// Helper to get all file IDs (for tab management)
function getAllFileIds(files: FileNode[]): string[] {
    const ids: string[] = [];
    for (const file of files) {
        if (file.type === 'file') {
            ids.push(file.id);
        }
        if (file.children) {
            ids.push(...getAllFileIds(file.children));
        }
    }
    return ids;
}

export const useProjectStore = create<ProjectStore>()(
    persist(
        (set, get) => ({
            files: [],
            activeFileId: null,
            openTabs: [],
            diffViewFileId: null,
            projectSource: 'generator',

            setFiles: (files) => {
                const allFileIds = getAllFileIds(files);
                const firstFileId = allFileIds[0] || null;
                set({
                    files,
                    activeFileId: firstFileId,
                    openTabs: firstFileId ? [firstFileId] : [],
                });
            },

            setProjectSource: (source) => set({ projectSource: source }),

            addFile: (file) =>
                set((state) => ({
                    files: [...state.files, file],
                })),

            updateFileContent: (fileId, content) =>
                set((state) => ({
                    files: updateFileInTree(state.files, fileId, content),
                })),

            deleteFile: (fileId) =>
                set((state) => {
                    const newFiles = deleteFileFromTree(state.files, fileId);
                    const newOpenTabs = state.openTabs.filter(id => id !== fileId);
                    const newActiveFileId = state.activeFileId === fileId
                        ? newOpenTabs[0] || null
                        : state.activeFileId;
                    return {
                        files: newFiles,
                        openTabs: newOpenTabs,
                        activeFileId: newActiveFileId,
                    };
                }),

            setActiveFile: (fileId) => set({ activeFileId: fileId }),

            openTab: (fileId) =>
                set((state) => ({
                    openTabs: state.openTabs.includes(fileId)
                        ? state.openTabs
                        : [...state.openTabs, fileId],
                    activeFileId: fileId,
                })),

            closeTab: (fileId) =>
                set((state) => {
                    const newOpenTabs = state.openTabs.filter(id => id !== fileId);
                    const newActiveFileId = state.activeFileId === fileId
                        ? newOpenTabs[newOpenTabs.length - 1] || null
                        : state.activeFileId;
                    return {
                        openTabs: newOpenTabs,
                        activeFileId: newActiveFileId,
                    };
                }),

            closeOtherTabs: (fileId) =>
                set((state) => ({
                    openTabs: [fileId],
                    activeFileId: fileId,
                })),

            closeAllTabs: () =>
                set({
                    openTabs: [],
                    activeFileId: null,
                }),

            closeTabsToRight: (fileId) =>
                set((state) => {
                    const index = state.openTabs.indexOf(fileId);
                    if (index === -1) return state;
                    const newOpenTabs = state.openTabs.slice(0, index + 1);
                    return {
                        openTabs: newOpenTabs,
                        // If active file was to the right, switch to the current file
                        activeFileId: newOpenTabs.includes(state.activeFileId || '')
                            ? state.activeFileId
                            : fileId,
                    };
                }),

            clearProject: () =>
                set({
                    files: [],
                    activeFileId: null,
                    openTabs: [],
                    diffViewFileId: null,
                    projectSource: 'generator',
                }),

            // Version management
            addFileVersion: (fileId, label, content) =>
                set((state) => ({
                    files: state.files.map(file => {
                        if (file.id === fileId) {
                            const newVersion = {
                                id: `v-${Date.now()}`,
                                label,
                                content,
                                timestamp: Date.now(),
                            };
                            return {
                                ...file,
                                versions: [...(file.versions || []), newVersion],
                            };
                        }
                        return file;
                    }),
                })),

            openDiffView: (fileId) => set({ diffViewFileId: fileId }),

            closeDiffView: () => set({ diffViewFileId: null }),

            getFileById: (fileId) => findFileById(get().files, fileId),

            getActiveFile: () => {
                const { activeFileId, files } = get();
                if (!activeFileId) return undefined;
                return findFileById(files, activeFileId);
            },
        }),
        {
            name: 'vcode-project',
            partialize: (state) => ({
                files: state.files,
                activeFileId: state.activeFileId,
                openTabs: state.openTabs,
                projectSource: state.projectSource,
            }),
        }
    )
);

// Parser for multi-file AI output
export function parseMultiFileOutput(output: string): FileNode[] {
    const files: FileNode[] = [];
    const fileRegex = /===FILE:\s*(.+?)===\n([\s\S]*?)(?====FILE:|===END===|$)/g;

    /**
     * Remove markdown code block wrappers (```language ... ```)
     */
    function stripMarkdownCodeBlock(code: string): string {
        let cleanCode = code.trim();

        // Remove markdown code block wrappers
        // Support ```tsx, ```javascript, ```, etc.
        const codeBlockRegex = /^```[\w-]*\n?([\s\S]*?)\n?```$/;
        const match = cleanCode.match(codeBlockRegex);
        if (match) {
            cleanCode = match[1].trim();
        }

        // Remove LLM thinking/reasoning content that appears before actual code
        // Remove lines starting with "*Thinking*", "**Header**", "> quote", etc.
        const lines = cleanCode.split('\n');
        let codeStartIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Check if this line looks like actual code (starts with import, class, const, etc.)
            if (/^(import|export|class|const|let|var|function|interface|type|async|\/\/|\/\*|from)/.test(line)) {
                codeStartIndex = i;
                break;
            }
            // Skip thinking markers, markdown headers, quotes, empty lines
            if (line === '' ||
                line.startsWith('*') ||
                line.startsWith('**') ||
                line.startsWith('>') ||
                line.startsWith('#') ||
                line.startsWith('---')) {
                continue;
            }
            // If it doesn't look like code or markdown, assume it might be explanation text
            // But only if we haven't found code yet
            if (!/^[{}\[\]();]/.test(line)) {
                continue;
            }
            codeStartIndex = i;
            break;
        }

        // If we found actual code, strip everything before it
        if (codeStartIndex > 0) {
            cleanCode = lines.slice(codeStartIndex).join('\n');
        }

        // Remove trailing "###" which often appears in LLM output
        cleanCode = cleanCode.replace(/\n\s*###\s*$/, '');

        // Also remove standalone "###" lines
        cleanCode = cleanCode.replace(/^\s*###\s*$/gm, '');

        return cleanCode.trim();
    }

    let match;
    // Helper to process match and add file
    const addFileFromMatch = (fileName: string, content: string) => {
        // Remove markdown code block wrappers if present
        content = stripMarkdownCodeBlock(content);

        const extension = fileName.split('.').pop()?.toLowerCase() || '';

        // Determine language from extension
        const languageMap: Record<string, string> = {
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'html': 'html',
            'md': 'markdown',
        };

        files.push({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: fileName,
            type: 'file',
            content,
            language: languageMap[extension] || 'plaintext',
        });
    };

    // Try standard format first
    let hasMatches = false;
    while ((match = fileRegex.exec(output)) !== null) {
        hasMatches = true;
        addFileFromMatch(match[1].trim(), match[2].trim());
    }

    // If no standard format matches found, try legacy format: // --- filename ---
    if (!hasMatches) {
        // This regex looks for: // --- filename --- (surrounded by newlines potentially)
        // We use split to handle this easier, or a similar regex
        // const legacyRegex = /.../g;

        // Handle the first file if it doesn't have a separator (index.tsx case)
        // But in useCodeGenerator, indexCode comes first without separator.
        // generatedCode: indexCode + '\n\n// --- modal.tsx ---\n\n' + ...

        // If the string contains "// --- ", we assume it is this format.
        if (output.includes('// --- ')) {
            const parts = output.split(/\/\/ --- (.+?) ---\n/);
            // parts[0] is the first file content (index.tsx)
            // parts[1] is filename1, parts[2] is content1, parts[3] is filename2...

            if (parts[0] && parts[0].trim()) {
                addFileFromMatch('index.tsx', parts[0].trim()); // Default name for first chunk
            }

            for (let i = 1; i < parts.length; i += 2) {
                if (i + 1 < parts.length) {
                    addFileFromMatch(parts[i].trim(), parts[i + 1].trim());
                }
            }
        }
    }

    // If no files parsed, treat entire output as a single file
    if (files.length === 0 && output.trim()) {
        files.push({
            id: `file-${Date.now()}`,
            name: 'Component.tsx',
            type: 'file',
            content: stripMarkdownCodeBlock(output.trim()),
            language: 'typescript',
        });
    }

    return files;
}
