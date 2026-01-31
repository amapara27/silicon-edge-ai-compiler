import { create } from 'zustand';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

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
    uploadStatus: UploadStatus;
    uploadError: string | null;
    modelInfo: ModelInfo | null;
    onnxFileName: string | null;
    dataFileName: string | null;

    uploadFiles: (onnxFile: File, dataFile?: File) => Promise<void>;
    resetUpload: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useUploadStore = create<UploadState>((set) => ({
    uploadStatus: 'idle',
    uploadError: null,
    modelInfo: null,
    onnxFileName: null,
    dataFileName: null,

    uploadFiles: async (onnxFile: File, dataFile?: File) => {
        set({
            uploadStatus: 'uploading',
            uploadError: null,
            onnxFileName: onnxFile.name,
            dataFileName: dataFile?.name || null
        });

        try {
            const formData = new FormData();
            formData.append('file', onnxFile);

            if (dataFile) {
                formData.append('data_file', dataFile);
            }

            const response = await fetch(`${API_URL}/model/upload`, {
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
        });
    },
}));
