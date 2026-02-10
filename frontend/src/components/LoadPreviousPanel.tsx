'use client';

import { useEffect, useState } from 'react';
import {
    ArrowLeft, FolderOpen, Loader2, Trash2, AlertCircle,
    Cpu, Zap, Clock, MemoryStick, HardDrive, ArrowRight,
} from 'lucide-react';
import { useModelSaveStore, SavedModel, SavedModelMetrics } from '@/store/modelSaveStore';
import { useGraphStore } from '@/store/graphStore';
import { useUploadStore } from '@/store/uploadStore';
import { useAppStore } from '@/store/appStore';
import { createClient } from '@/utils/supabase/client';

function formatBytes(bytes: number): string {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${bytes}B`;
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ModelCard({
    model,
    onLoad,
    onDelete,
    isLoading,
}: {
    model: SavedModel;
    onLoad: () => void;
    onDelete: () => void;
    isLoading: boolean;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const metrics = model.metrics as SavedModelMetrics;

    return (
        <div className="group bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm hover:border-zinc-700/80 transition-all duration-300">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-tight">
                            {model.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-zinc-600">v{model.version}</span>
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                {model.target_chip}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                    <Clock className="w-3 h-3" />
                    {timeAgo(model.updated_at)}
                </div>
            </div>

            {/* Metrics row */}
            {(metrics.ram_used || metrics.total_flops || metrics.total_parameters) && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {metrics.ram_used != null && metrics.ram_total != null && (
                        <div className="flex items-center gap-1.5 p-2 bg-zinc-800/40 rounded-lg">
                            <MemoryStick className="w-3 h-3 text-violet-400 flex-shrink-0" />
                            <span className="text-[10px] text-zinc-400 truncate">
                                {formatBytes(metrics.ram_used)}
                            </span>
                        </div>
                    )}
                    {metrics.flash_used != null && metrics.flash_total != null && (
                        <div className="flex items-center gap-1.5 p-2 bg-zinc-800/40 rounded-lg">
                            <HardDrive className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span className="text-[10px] text-zinc-400 truncate">
                                {formatBytes(metrics.flash_used)}
                            </span>
                        </div>
                    )}
                    {metrics.total_flops != null && (
                        <div className="flex items-center gap-1.5 p-2 bg-zinc-800/40 rounded-lg">
                            <Cpu className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span className="text-[10px] text-zinc-400 truncate">
                                {formatNumber(metrics.total_flops)} FLOPs
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/50">
                {confirmDelete ? (
                    <>
                        <span className="text-[11px] text-red-400 mr-auto">Delete this model?</span>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onDelete}
                            className="px-3 py-1.5 rounded-lg text-[11px] text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                        >
                            Confirm
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onLoad}
                            disabled={isLoading}
                            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    Load Model
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export function LoadPreviousPanel() {
    const { savedModels, fetchSavedModels, loadModel, deleteModel, fetchStatus, loadStatus, error } = useModelSaveStore();
    const { setNodes, setEdges, setTargetChip } = useGraphStore();
    const { uploadFiles } = useUploadStore();
    const { setMode } = useAppStore();
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setIsAuthenticated(!!user);
            if (user) {
                fetchSavedModels();
            }
        };
        checkAuth();
    }, [fetchSavedModels]);

    const handleLoad = async (modelId: string) => {
        setLoadingId(modelId);
        const result = await loadModel(modelId);

        if (result) {
            // Set the graph topology
            setNodes(result.graphNodes);
            setEdges(result.graphEdges);
            setTargetChip(result.targetChip as any);

            // Upload files to backend for compilation/profiling
            await uploadFiles(result.onnxFile, result.dataFile || undefined);

            // Switch to playground
            setMode('import-existing');
        }

        setLoadingId(null);
    };

    const handleDelete = async (modelId: string) => {
        await deleteModel(modelId);
    };

    // Not authenticated
    if (isAuthenticated === false) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-6">
                        <FolderOpen className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Sign in required</h2>
                    <p className="text-sm text-zinc-500 mb-6">
                        Sign in to access your saved models.
                    </p>
                    <button
                        onClick={() => setMode('landing')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors mx-auto"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            {/* Top bar */}
            <div className="border-b border-zinc-800/50">
                <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Zap className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="text-lg font-semibold text-white tracking-tight">Silicon</span>
                    </div>
                    <button
                        onClick={() => setMode('landing')}
                        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to home
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 max-w-5xl mx-auto px-8 py-10 w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Saved Models</h1>
                        <p className="text-sm text-zinc-500 mt-1">Load a previously saved model to continue working on it</p>
                    </div>
                    {savedModels.length > 0 && (
                        <span className="text-xs text-zinc-600">
                            {savedModels.length} model{savedModels.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Loading state */}
                {fetchStatus === 'fetching' && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-violet-400 animate-spin mb-3" />
                        <p className="text-sm text-zinc-500">Loading your models...</p>
                    </div>
                )}

                {/* Error state */}
                {fetchStatus === 'error' && error && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
                        <p className="text-sm text-red-400 mb-1">Failed to load models</p>
                        <p className="text-xs text-zinc-600">{error}</p>
                    </div>
                )}

                {/* Empty state */}
                {fetchStatus === 'success' && savedModels.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-6">
                            <FolderOpen className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No saved models yet</h3>
                        <p className="text-sm text-zinc-500 mb-6 text-center max-w-sm">
                            Import a model and click &ldquo;Save Model&rdquo; in the toolbar to save it here.
                        </p>
                        <button
                            onClick={() => setMode('import-existing')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 transition-all"
                        >
                            Import your first model
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Model grid */}
                {fetchStatus === 'success' && savedModels.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedModels.map((model) => (
                            <ModelCard
                                key={model.id}
                                model={model}
                                onLoad={() => handleLoad(model.id)}
                                onDelete={() => handleDelete(model.id)}
                                isLoading={loadingId === model.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
