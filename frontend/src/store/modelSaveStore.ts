'use client';

import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '@/store/graphStore';

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

export interface SavedModel {
    id: string;
    user_id: string;
    name: string;
    version: number;
    target_chip: string;
    metrics: SavedModelMetrics;
    onnx_path: string;
    c_code_path: string | null;
    gui_state_path: string | null;
    is_deployed: boolean;
    created_at: string;
    updated_at: string;
}

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';
export type FetchStatus = 'idle' | 'fetching' | 'success' | 'error';

interface ModelSaveState {
    // State
    savedModels: SavedModel[];
    saveStatus: SaveStatus;
    loadStatus: LoadStatus;
    fetchStatus: FetchStatus;
    error: string | null;

    // Actions
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

const BUCKET = 'models';

export const useModelSaveStore = create<ModelSaveState>((set, get) => ({
    savedModels: [],
    saveStatus: 'idle',
    loadStatus: 'idle',
    fetchStatus: 'idle',
    error: null,

    // ── Fetch all saved models for the current user ──
    fetchSavedModels: async () => {
        set({ fetchStatus: 'fetching', error: null });

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                set({ fetchStatus: 'error', error: 'Not authenticated' });
                return;
            }

            const { data, error } = await supabase
                .from('saved_models')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            set({
                savedModels: data as SavedModel[],
                fetchStatus: 'success',
                error: null,
            });
        } catch (error) {
            set({
                fetchStatus: 'error',
                error: error instanceof Error ? error.message : 'Failed to fetch models',
            });
        }
    },

    // ── Save a model ──
    saveModel: async ({ name, onnxFile, dataFile, graphNodes, graphEdges, targetChip, metrics }) => {
        set({ saveStatus: 'saving', error: null });

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                set({ saveStatus: 'error', error: 'Not authenticated' });
                return;
            }

            // Generate a unique model ID for storage paths
            const modelId = crypto.randomUUID();
            const basePath = `${user.id}/${modelId}`;

            // 1. Upload .onnx to bucket
            const onnxPath = `${basePath}/model.onnx`;
            const { error: onnxError } = await supabase.storage
                .from(BUCKET)
                .upload(onnxPath, onnxFile, {
                    contentType: 'application/octet-stream',
                    upsert: true,
                });
            if (onnxError) throw new Error(`ONNX upload failed: ${onnxError.message}`);

            // 2. Upload .data to bucket
            let cCodePath: string | null = null;
            if (dataFile) {
                cCodePath = `${basePath}/model.data`;
                const { error: dataError } = await supabase.storage
                    .from(BUCKET)
                    .upload(cCodePath, dataFile, {
                        contentType: 'application/octet-stream',
                        upsert: true,
                    });
                if (dataError) throw new Error(`Data file upload failed: ${dataError.message}`);
            }

            // 3. Upload graph JSON (React Flow nodes + edges) to bucket
            const guiState = JSON.stringify({ nodes: graphNodes, edges: graphEdges });
            const guiBlob = new Blob([guiState], { type: 'application/json' });
            const guiStatePath = `${basePath}/graph.json`;
            const { error: guiError } = await supabase.storage
                .from(BUCKET)
                .upload(guiStatePath, guiBlob, {
                    contentType: 'application/json',
                    upsert: true,
                });
            if (guiError) throw new Error(`GUI state upload failed: ${guiError.message}`);

            // 4. Determine next version number
            const { data: existing } = await supabase
                .from('saved_models')
                .select('version')
                .eq('user_id', user.id)
                .eq('name', name)
                .order('version', { ascending: false })
                .limit(1);

            const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

            // 5. Insert row into saved_models
            const { error: insertError } = await supabase
                .from('saved_models')
                .insert({
                    user_id: user.id,
                    name,
                    version: nextVersion,
                    target_chip: targetChip,
                    metrics: metrics || {},
                    onnx_path: onnxPath,
                    c_code_path: cCodePath,
                    gui_state_path: guiStatePath,
                });

            if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);

            set({ saveStatus: 'success', error: null });

            // Refresh the list
            await get().fetchSavedModels();
        } catch (error) {
            set({
                saveStatus: 'error',
                error: error instanceof Error ? error.message : 'Save failed',
            });
        }
    },

    // ── Load a model ──
    loadModel: async (modelId: string) => {
        set({ loadStatus: 'loading', error: null });

        try {
            const supabase = createClient();

            // 1. Fetch the model row
            const { data: model, error: fetchError } = await supabase
                .from('saved_models')
                .select('*')
                .eq('id', modelId)
                .single();

            if (fetchError || !model) {
                throw new Error('Model not found');
            }

            // 2. Download .onnx from bucket
            const { data: onnxData, error: onnxError } = await supabase.storage
                .from(BUCKET)
                .download(model.onnx_path);

            if (onnxError || !onnxData) {
                throw new Error(`ONNX download failed: ${onnxError?.message}`);
            }

            const onnxFile = new File([onnxData], 'model.onnx', {
                type: 'application/octet-stream',
            });

            // 3. Download .data from bucket (if exists)
            let dataFile: File | null = null;
            if (model.c_code_path) {
                const { data: dataBlob, error: dataError } = await supabase.storage
                    .from(BUCKET)
                    .download(model.c_code_path);

                if (!dataError && dataBlob) {
                    dataFile = new File([dataBlob], 'model.data', {
                        type: 'application/octet-stream',
                    });
                }
            }

            // 4. Download graph.json from bucket
            let graphNodes: Node<NodeData>[] = [];
            let graphEdges: Edge[] = [];
            if (model.gui_state_path) {
                const { data: guiBlob, error: guiError } = await supabase.storage
                    .from(BUCKET)
                    .download(model.gui_state_path);

                if (!guiError && guiBlob) {
                    const guiText = await guiBlob.text();
                    const guiState = JSON.parse(guiText);
                    graphNodes = guiState.nodes || [];
                    graphEdges = guiState.edges || [];
                }
            }

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

    // ── Delete a model ──
    deleteModel: async (modelId: string) => {
        try {
            const supabase = createClient();

            // Fetch the model to get storage paths
            const { data: model } = await supabase
                .from('saved_models')
                .select('*')
                .eq('id', modelId)
                .single();

            if (model) {
                // Delete bucket files
                const pathsToDelete = [model.onnx_path];
                if (model.c_code_path) pathsToDelete.push(model.c_code_path);
                if (model.gui_state_path) pathsToDelete.push(model.gui_state_path);

                await supabase.storage.from(BUCKET).remove(pathsToDelete);
            }

            // Delete the database row
            const { error } = await supabase
                .from('saved_models')
                .delete()
                .eq('id', modelId);

            if (error) throw error;

            // Refresh the list
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
