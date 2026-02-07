import { create } from 'zustand';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
export type CompileStatus = 'idle' | 'compiling' | 'success' | 'error';

export interface WeightInfo {
    name: string;
    shape: number[];
    dtype: string;
    size: number;
}

export interface LayerInfo {
    name: string;
    op_type: string;
    inputs: string[];
    outputs: string[];
}

export interface ModelInfo {
    inputs: Array<{ name: string; shape: (number | string)[]; dtype: number }>;
    outputs: Array<{ name: string; shape: (number | string)[]; dtype: number }>;
    operators: string[];
    layers: LayerInfo[];
    ir_version: number;
    producer_name: string;
    model_version: number;
    weights: WeightInfo[];
    total_parameters: number;
}

interface UploadState {
    // Upload state
    uploadStatus: UploadStatus;
    uploadError: string | null;
    modelInfo: ModelInfo | null;
    onnxFileName: string | null;
    dataFileName: string | null;
    onnxFile: File | null;      // Store file for profiling
    dataFile: File | null;      // Store file for profiling

    // Compile state
    compileStatus: CompileStatus;
    compileError: string | null;
    compiledSourceCode: string | null;
    compiledHeaderCode: string | null;
    compiledModelName: string | null;

    // Actions
    uploadFiles: (onnxFile: File, dataFile?: File) => Promise<void>;
    resetUpload: () => void;
    compileModel: (modelName: string, targetChip: string) => Promise<void>;
    resetCompile: () => void;
    downloadCompiledFiles: (modelName: string, targetChip: string) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useUploadStore = create<UploadState>((set, get) => ({
    // Upload state
    uploadStatus: 'idle',
    uploadError: null,
    modelInfo: null,
    onnxFileName: null,
    dataFileName: null,
    onnxFile: null,
    dataFile: null,

    // Compile state
    compileStatus: 'idle',
    compileError: null,
    compiledSourceCode: null,
    compiledHeaderCode: null,
    compiledModelName: null,

    uploadFiles: async (onnxFile: File, dataFile?: File) => {
        set({
            uploadStatus: 'uploading',
            uploadError: null,
            onnxFileName: onnxFile.name,
            dataFileName: dataFile?.name || null,
            onnxFile: onnxFile,
            dataFile: dataFile || null,
            // Reset compile state when uploading new model
            compileStatus: 'idle',
            compiledSourceCode: null,
            compiledHeaderCode: null,
        });

        try {
            const formData = new FormData();
            formData.append('file', onnxFile);

            if (dataFile) {
                formData.append('data_file', dataFile);
            }

            const response = await fetch(`${API_URL}/load-model/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Upload failed: ${response.status}`);
            }

            const data = await response.json();

            if (!data.valid) {
                set({
                    uploadStatus: 'error',
                    uploadError: data.error || 'Invalid ONNX model',
                    modelInfo: null,
                });
                return;
            }

            set({
                uploadStatus: 'success',
                modelInfo: data.model_info,
                uploadError: null,
            });
        } catch (error) {
            set({
                uploadStatus: 'error',
                uploadError: error instanceof Error ? error.message : 'Upload failed',
                modelInfo: null,
            });
        }
    },

    resetUpload: () => {
        set({
            uploadStatus: 'idle',
            uploadError: null,
            modelInfo: null,
            onnxFileName: null,
            dataFileName: null,
            onnxFile: null,
            dataFile: null,
            compileStatus: 'idle',
            compileError: null,
            compiledSourceCode: null,
            compiledHeaderCode: null,
            compiledModelName: null,
        });
    },

    compileModel: async (modelName: string, targetChip: string) => {
        const { modelInfo } = get();

        if (!modelInfo) {
            set({
                compileStatus: 'error',
                compileError: 'No model loaded',
            });
            return;
        }

        set({
            compileStatus: 'compiling',
            compileError: null,
        });

        try {
            const response = await fetch(`${API_URL}/compile-model/compile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model_name: modelName,
                    target_chip: targetChip,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Compilation failed: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                set({
                    compileStatus: 'error',
                    compileError: data.error || 'Compilation failed',
                });
                return;
            }

            set({
                compileStatus: 'success',
                compileError: null,
                compiledSourceCode: data.source_code,
                compiledHeaderCode: data.header_code,
                compiledModelName: data.model_name,
            });
        } catch (error) {
            set({
                compileStatus: 'error',
                compileError: error instanceof Error ? error.message : 'Compilation failed',
            });
        }
    },

    resetCompile: () => {
        set({
            compileStatus: 'idle',
            compileError: null,
            compiledSourceCode: null,
            compiledHeaderCode: null,
            compiledModelName: null,
        });
    },

    downloadCompiledFiles: async (modelName: string, targetChip: string) => {
        try {
            const response = await fetch(`${API_URL}/compile-model/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model_name: modelName,
                    target_chip: targetChip,
                }),
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            // Trigger file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${modelName}_c_code.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Download failed:', error);
        }
    },
}));
