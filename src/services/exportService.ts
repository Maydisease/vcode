// Code export utilities
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { toast } from '../components/Toast/Toast';
import type { FileNode } from '../types';

/**
 * Copy code to clipboard
 */
export async function copyToClipboard(code: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(code);
        toast.success('代码已复制到剪贴板');
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        toast.error('复制失败，请手动复制');
        return false;
    }
}

/**
 * Download code as a file
 */
export function downloadAsFile(code: string, filename: string): void {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`已下载: ${filename}`);
}

/**
 * Save code to a file using Tauri dialog
 */
export async function saveToFile(code: string, suggestedName: string): Promise<boolean> {
    try {
        const filePath = await save({
            defaultPath: suggestedName,
            filters: [
                { name: 'TypeScript', extensions: ['tsx', 'ts'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });

        if (filePath) {
            await writeTextFile(filePath, code);
            toast.success(`已保存到: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to save file:', error);
        toast.error('保存失败');
        return false;
    }
}

/**
 * Export all files as a combined string or individually
 */
export function combineFiles(files: FileNode[]): string {
    return files
        .filter(f => f.type === 'file' && f.content)
        .map(f => `// ========== ${f.name} ==========\n\n${f.content}`)
        .join('\n\n');
}

/**
 * Download all files as a zip (simplified: downloads as combined file)
 */
export function downloadAllFiles(files: FileNode[]): void {
    const combined = combineFiles(files);
    if (combined) {
        downloadAsFile(combined, 'generated-code.txt');
    } else {
        toast.warning('没有可导出的代码');
    }
}

/**
 * Get suggested filename from file node
 */
export function getSuggestedFilename(file: FileNode | null, fallback: string = 'code.tsx'): string {
    return file?.name || fallback;
}
