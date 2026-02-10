'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// ── Types ──

export interface SavedModelRow {
    id: string;
    user_id: string;
    name: string;
    version: number;
    target_chip: string;
    metrics: Record<string, unknown>;
    onnx_path: string;
    c_code_path: string | null;
    gui_state_path: string | null;
    is_deployed: boolean;
    created_at: string;
    updated_at: string;
}

interface ActionResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

const BUCKET = 'models';

// ── Fetch all saved models for the current user ──

export async function fetchSavedModelsAction(): Promise<ActionResult<SavedModelRow[]>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('saved_models')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data as SavedModelRow[] };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch models' };
    }
}

// ── Save a model ──

export async function saveModelAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Extract fields from FormData
        const name = formData.get('name') as string;
        const targetChip = formData.get('targetChip') as string;
        const metricsJson = formData.get('metrics') as string;
        const onnxFile = formData.get('onnxFile') as File;
        const dataFile = formData.get('dataFile') as File | null;
        const guiStateJson = formData.get('guiState') as string;

        if (!name || !onnxFile) {
            return { success: false, error: 'Model name and ONNX file are required' };
        }

        const metrics = metricsJson ? JSON.parse(metricsJson) : {};

        // Generate unique storage path
        const modelId = crypto.randomUUID();
        const basePath = `${user.id}/${modelId}`;

        // 1. Upload .onnx to bucket
        const onnxPath = `${basePath}/model.onnx`;
        const onnxBuffer = Buffer.from(await onnxFile.arrayBuffer());
        const { error: onnxError } = await supabase.storage
            .from(BUCKET)
            .upload(onnxPath, onnxBuffer, {
                contentType: 'application/octet-stream',
                upsert: true,
            });
        if (onnxError) {
            return { success: false, error: `ONNX upload failed: ${onnxError.message}` };
        }

        // 2. Upload .data to bucket (required)
        let cCodePath: string | null = null;
        if (dataFile && dataFile.size > 0) {
            cCodePath = `${basePath}/model.data`;
            const dataBuffer = Buffer.from(await dataFile.arrayBuffer());
            const { error: dataError } = await supabase.storage
                .from(BUCKET)
                .upload(cCodePath, dataBuffer, {
                    contentType: 'application/octet-stream',
                    upsert: true,
                });
            if (dataError) {
                return { success: false, error: `Data file upload failed: ${dataError.message}` };
            }
        }

        // 3. Upload graph JSON to bucket
        let guiStatePath: string | null = null;
        if (guiStateJson) {
            guiStatePath = `${basePath}/graph.json`;
            const guiBuffer = Buffer.from(guiStateJson, 'utf-8');
            const { error: guiError } = await supabase.storage
                .from(BUCKET)
                .upload(guiStatePath, guiBuffer, {
                    contentType: 'application/json',
                    upsert: true,
                });
            if (guiError) {
                return { success: false, error: `GUI state upload failed: ${guiError.message}` };
            }
        }

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
        const { data: inserted, error: insertError } = await supabase
            .from('saved_models')
            .insert({
                user_id: user.id,
                name,
                version: nextVersion,
                target_chip: targetChip || 'STM32F401',
                metrics,
                onnx_path: onnxPath,
                c_code_path: cCodePath,
                gui_state_path: guiStatePath,
            })
            .select('id')
            .single();

        if (insertError) {
            return { success: false, error: `Database insert failed: ${insertError.message}` };
        }

        revalidatePath('/');
        return { success: true, data: { id: inserted.id } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Save failed' };
    }
}

// ── Load a model (returns metadata + signed download URLs) ──

export interface LoadModelResult {
    model: SavedModelRow;
    onnxUrl: string;
    dataUrl: string | null;
    guiState: { nodes: unknown[]; edges: unknown[] } | null;
}

export async function loadModelAction(modelId: string): Promise<ActionResult<LoadModelResult>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // 1. Fetch the model row
        const { data: model, error: fetchError } = await supabase
            .from('saved_models')
            .select('*')
            .eq('id', modelId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !model) {
            return { success: false, error: 'Model not found' };
        }

        // 2. Create signed URL for .onnx
        const { data: onnxSigned, error: onnxError } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(model.onnx_path, 3600); // 1 hour expiry

        if (onnxError || !onnxSigned) {
            return { success: false, error: `ONNX download failed: ${onnxError?.message}` };
        }

        // 3. Create signed URL for .data (if exists)
        let dataUrl: string | null = null;
        if (model.c_code_path) {
            const { data: dataSigned } = await supabase.storage
                .from(BUCKET)
                .createSignedUrl(model.c_code_path, 3600);
            dataUrl = dataSigned?.signedUrl || null;
        }

        // 4. Download and parse graph.json server-side
        let guiState: { nodes: unknown[]; edges: unknown[] } | null = null;
        if (model.gui_state_path) {
            const { data: guiBlob, error: guiError } = await supabase.storage
                .from(BUCKET)
                .download(model.gui_state_path);

            if (!guiError && guiBlob) {
                const guiText = await guiBlob.text();
                guiState = JSON.parse(guiText);
            }
        }

        return {
            success: true,
            data: {
                model: model as SavedModelRow,
                onnxUrl: onnxSigned.signedUrl,
                dataUrl,
                guiState,
            },
        };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Load failed' };
    }
}

// ── Delete a model ──

export async function deleteModelAction(modelId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Fetch the model to get storage paths (also verifies ownership via RLS)
        const { data: model } = await supabase
            .from('saved_models')
            .select('*')
            .eq('id', modelId)
            .eq('user_id', user.id)
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
            .eq('id', modelId)
            .eq('user_id', user.id);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/');
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Delete failed' };
    }
}

// ── Check auth status ──

export async function checkAuthAction(): Promise<ActionResult<{ authenticated: boolean }>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return { success: true, data: { authenticated: !!user } };
    } catch {
        return { success: true, data: { authenticated: false } };
    }
}
