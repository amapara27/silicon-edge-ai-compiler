'use client';

import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '@/store/graphStore';
import {
    fetchSavedModelsAction,
    saveModelAction,
    loadModelAction,
    deleteModelAction,
    SavedModelRow,
} from '@/app/actions/models';

// ── Types ──

export interface SavedModelMetrics {
    ram_used?: number;
    ram_total?: number;
    flash_used?: number;
    flash_total?: number;
    total_flops?: number;
    total_parameters?: number;
    board_name?: string;
}

export type SavedModel = SavedModelRow;
export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';
export type FetchStatus = 'idle' | 'fetching' | 'success' | 'error';

interface ModelSaveState {
    savedModels: SavedModel[];
    saveStatus: SaveStatus;
    loadStatus: LoadStatus;
    fetchStatus: FetchStatus;
    error: string | null;

    fetchSavedModels: () => Promise<void>;
    saveModel: (params: {
        name: string;
        onnxFile: File;
        dataFile: File;
        graphNodes: Node<NodeData>[];
        graphEdges: Edge[];
        targetChip: string;
        metrics?: SavedModelMetrics;
    }) => Promise<void>;
    loadModel: (modelId: string) => Promise<{
        onnxFile: File;
        dataFile: File | null;
        graphNodes: Node<NodeData>[];
        graphEdges: Edge[];
        targetChip: string;
        metrics: SavedModelMetrics;
    } | null>;
    deleteModel: (modelId: string) => Promise<void>;
    resetSaveStatus: () => void;
    resetLoadStatus: () => void;
}

export const useModelSaveStore = create<ModelSaveState>((set, get) => ({
    savedModels: [],
    saveStatus: 'idle',
    loadStatus: 'idle',
    fetchStatus: 'idle',
    error: null,

    // ── Fetch (delegates to server action) ──
    fetchSavedModels: async () => {
        set({ fetchStatus: 'fetching', error: null });
        const result = await fetchSavedModelsAction();

        if (result.success && result.data) {
            set({ savedModels: result.data, fetchStatus: 'success', error: null });
        } else {
            set({ fetchStatus: 'error', error: result.error || 'Failed to fetch models' });
        }
    },

    // ── Save (builds FormData, delegates to server action) ──
    saveModel: async ({ name, onnxFile, dataFile, graphNodes, graphEdges, targetChip, metrics }) => {
        set({ saveStatus: 'saving', error: null });

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('targetChip', targetChip);
            formData.append('metrics', JSON.stringify(metrics || {}));
            formData.append('onnxFile', onnxFile);
            if (dataFile) {
                formData.append('dataFile', dataFile);
            }
            formData.append('guiState', JSON.stringify({ nodes: graphNodes, edges: graphEdges }));

            const result = await saveModelAction(formData);

            if (result.success) {
                set({ saveStatus: 'success', error: null });
                await get().fetchSavedModels();
            } else {
                set({ saveStatus: 'error', error: result.error || 'Save failed' });
            }
        } catch (error) {
            set({
                saveStatus: 'error',
                error: error instanceof Error ? error.message : 'Save failed',
            });
        }
    },

    // ── Load (server action returns signed URLs + graph JSON, client fetches files) ──
    loadModel: async (modelId: string) => {
        set({ loadStatus: 'loading', error: null });

        try {
            const result = await loadModelAction(modelId);

            if (!result.success || !result.data) {
                set({ loadStatus: 'error', error: result.error || 'Load failed' });
                return null;
            }

            const { model, onnxUrl, dataUrl, guiState } = result.data;

            // Download .onnx via signed URL (client-side fetch of the file blob)
            const onnxResponse = await fetch(onnxUrl);
            if (!onnxResponse.ok) throw new Error('Failed to download ONNX file');
            const onnxBlob = await onnxResponse.blob();
            const onnxFile = new File([onnxBlob], 'model.onnx', { type: 'application/octet-stream' });

            // Download .data via signed URL (if exists)
            let dataFile: File | null = null;
            if (dataUrl) {
                const dataResponse = await fetch(dataUrl);
                if (dataResponse.ok) {
                    const dataBlob = await dataResponse.blob();
                    dataFile = new File([dataBlob], 'model.data', { type: 'application/octet-stream' });
                }
            }

            // Graph state already parsed server-side
            const graphNodes = (guiState?.nodes || []) as Node<NodeData>[];
            const graphEdges = (guiState?.edges || []) as Edge[];

            set({ loadStatus: 'success', error: null });

            return {
                onnxFile,
                dataFile,
                graphNodes,
                graphEdges,
                targetChip: model.target_chip,
                metrics: model.metrics as SavedModelMetrics,
            };
        } catch (error) {
            set({
                loadStatus: 'error',
                error: error instanceof Error ? error.message : 'Load failed',
            });
            return null;
        }
    },

    // ── Delete (delegates to server action) ──
    deleteModel: async (modelId: string) => {
        try {
            const result = await deleteModelAction(modelId);
            if (!result.success) {
                set({ error: result.error || 'Delete failed' });
                return;
            }
            await get().fetchSavedModels();
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Delete failed',
            });
        }
    },

    resetSaveStatus: () => set({ saveStatus: 'idle', error: null }),
    resetLoadStatus: () => set({ loadStatus: 'idle', error: null }),
}));
