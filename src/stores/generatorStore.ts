import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GeneratorState } from '../types';
import type { SelectedApis } from '../components/ApiSelector/ApiSelector';

// Generation workflow steps
export type GeneratorStep = 'idle' | 'api-select' | 'generating' | 'refining' | 'done';

// Track which files need to be generated
export type PendingFile = 'index' | 'modal' | 'service';

interface GeneratorStore extends GeneratorState {
    // Workflow state
    step: GeneratorStep;
    selectedApis: SelectedApis | null;

    // Pending generation tracking for resume after refresh
    pendingFiles: PendingFile[];
    needsResume: boolean;
    activeTasks: Record<string, string>;

    // Actions
    setImage: (file: File | null) => void;
    setImagePreview: (preview: string | null) => void;
    setGeneratedCode: (code: string) => void;
    appendCode: (chunk: string) => void;
    setIsGenerating: (isGenerating: boolean) => void;
    setProgress: (progress: number) => void;
    setStep: (step: GeneratorStep) => void;
    setSelectedApis: (apis: SelectedApis | null) => void;
    setPendingFiles: (files: PendingFile[]) => void;
    markFileComplete: (file: PendingFile) => void;
    setNeedsResume: (needs: boolean) => void;
    setTask: (key: string, id: string | null) => void;
    reset: () => void;
}

const initialState: GeneratorState & {
    step: GeneratorStep;
    selectedApis: SelectedApis | null;
    pendingFiles: PendingFile[];
    needsResume: boolean;
    activeTasks: Record<string, string>;
} = {
    isGenerating: false,
    currentImage: null,
    imagePreview: null,
    generatedCode: '',
    progress: 0,
    step: 'idle',
    selectedApis: null,
    pendingFiles: [],
    needsResume: false,
    activeTasks: {},
};

export const useGeneratorStore = create<GeneratorStore>()(
    persist(
        (set) => ({
            ...initialState,

            setImage: (file) => set({ currentImage: file }),

            setImagePreview: (preview) => set({ imagePreview: preview }),

            setGeneratedCode: (code) => set({ generatedCode: code }),

            appendCode: (chunk) =>
                set((state) => ({ generatedCode: state.generatedCode + chunk })),

            setIsGenerating: (isGenerating) => set({ isGenerating }),

            setProgress: (progress) => set({ progress }),

            setStep: (step) => set({ step }),

            setSelectedApis: (apis) => set({ selectedApis: apis }),

            setPendingFiles: (files) => set({ pendingFiles: files }),

            markFileComplete: (file) =>
                set((state) => ({
                    pendingFiles: state.pendingFiles.filter(f => f !== file),
                })),

            setNeedsResume: (needs) => set({ needsResume: needs }),

            setTask: (key, id) => set((state) => {
                if (id === null) {
                    const newTasks = { ...state.activeTasks };
                    delete newTasks[key];
                    return { activeTasks: newTasks };
                }
                return { activeTasks: { ...state.activeTasks, [key]: id } };
            }),

            reset: () => set(initialState),
        }),
        {
            name: 'vcode-generator',
            partialize: (state) => ({
                imagePreview: state.imagePreview,
                selectedApis: state.selectedApis,
                step: state.step,
                // Mark that we need to resume if step is 'generating' or 'refining'
                needsResume: state.step === 'generating' || state.step === 'refining',
                activeTasks: state.activeTasks,
            }),
        }
    )
);
