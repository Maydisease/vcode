import { create } from 'zustand';
import type { GeneratorState } from '../types';
import type { SelectedApis } from '../components/ApiSelector/ApiSelector';

// Generation workflow steps
export type GeneratorStep = 'idle' | 'api-select' | 'generating' | 'refining' | 'done';

interface GeneratorStore extends GeneratorState {
    // Workflow state
    step: GeneratorStep;
    selectedApis: SelectedApis | null;

    // Actions
    setImage: (file: File | null) => void;
    setImagePreview: (preview: string | null) => void;
    setGeneratedCode: (code: string) => void;
    appendCode: (chunk: string) => void;
    setIsGenerating: (isGenerating: boolean) => void;
    setProgress: (progress: number) => void;
    setStep: (step: GeneratorStep) => void;
    setSelectedApis: (apis: SelectedApis | null) => void;
    reset: () => void;
}

const initialState: GeneratorState & { step: GeneratorStep; selectedApis: SelectedApis | null } = {
    isGenerating: false,
    currentImage: null,
    imagePreview: null,
    generatedCode: '',
    progress: 0,
    step: 'idle',
    selectedApis: null,
};

export const useGeneratorStore = create<GeneratorStore>((set) => ({
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

    reset: () => set(initialState),
}));
