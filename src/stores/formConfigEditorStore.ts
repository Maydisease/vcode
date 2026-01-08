/**
 * Store for FormConfig Visual Editor state
 */
import { create } from 'zustand';
import type { FormField } from '../utils/codeGenerator';

interface CodeRange {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

interface FormConfigEditorState {
    // Modal visibility
    isOpen: boolean;

    // The fields being edited
    fields: FormField[];

    // Metadata about the variable
    variableName: string;
    typeName: string;

    // Where to replace in the editor
    codeRange: CodeRange | null;

    // Original code (for comparison/undo)
    originalCode: string;

    // Actions
    open: (params: {
        fields: FormField[];
        variableName: string;
        typeName: string;
        codeRange: CodeRange;
        originalCode: string;
    }) => void;
    close: () => void;

    // Field operations
    updateField: (id: string, updates: Partial<FormField>) => void;
    addField: (field: FormField) => void;
    removeField: (id: string) => void;
    reorderFields: (fromIndex: number, toIndex: number) => void;
    setFields: (fields: FormField[]) => void;
}

export const useFormConfigEditorStore = create<FormConfigEditorState>((set) => ({
    isOpen: false,
    fields: [],
    variableName: '',
    typeName: 'FormConfig',
    codeRange: null,
    originalCode: '',

    open: ({ fields, variableName, typeName, codeRange, originalCode }) => set({
        isOpen: true,
        fields,
        variableName,
        typeName,
        codeRange,
        originalCode,
    }),

    close: () => set({
        isOpen: false,
        fields: [],
        variableName: '',
        typeName: 'FormConfig',
        codeRange: null,
        originalCode: '',
    }),

    updateField: (id, updates) => set((state) => ({
        fields: state.fields.map((field) =>
            field.id === id ? { ...field, ...updates } : field
        ),
    })),

    addField: (field) => set((state) => ({
        fields: [...state.fields, field],
    })),

    removeField: (id) => set((state) => ({
        fields: state.fields.filter((field) => field.id !== id),
    })),

    reorderFields: (fromIndex, toIndex) => set((state) => {
        const newFields = [...state.fields];
        const [removed] = newFields.splice(fromIndex, 1);
        newFields.splice(toIndex, 0, removed);
        return { fields: newFields };
    }),

    setFields: (fields) => set({ fields }),
}));
