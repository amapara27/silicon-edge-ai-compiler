'use client';

import { useState, useEffect } from 'react';
import {
    X, Save, Loader2, CheckCircle, AlertCircle,
    Cpu, Layers, Zap,
} from 'lucide-react';
import { useModelSaveStore, SavedModelMetrics } from '@/store/modelSaveStore';
import { useGraphStore } from '@/store/graphStore';
import { useUploadStore } from '@/store/uploadStore';
import { useProfilingStore } from '@/store/profilingStore';

interface SaveModelDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SaveModelDialog({ isOpen, onClose }: SaveModelDialogProps) {
    const [modelName, setModelName] = useState('');
    const { saveModel, saveStatus, error, resetSaveStatus } = useModelSaveStore();
    const { nodes, edges, targetChip } = useGraphStore();
    const { onnxFile, dataFile, modelInfo } = useUploadStore();
    const { profilingData } = useProfilingStore();

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setModelName('');
            resetSaveStatus();
        }
    }, [isOpen, resetSaveStatus]);

    if (!isOpen) return null;

    const canSave = modelName.trim().length > 0 && onnxFile && saveStatus !== 'saving';

    const handleSave = async () => {
        if (!onnxFile || !modelName.trim()) return;

        // Build metrics from profiling data
        const metrics: SavedModelMetrics = {};
        if (profilingData) {
            metrics.ram_used = profilingData.ramUsed;
            metrics.ram_total = profilingData.ramTotal;
            metrics.flash_used = profilingData.flashUsed;
            metrics.flash_total = profilingData.flashTotal;
            metrics.total_flops = profilingData.totalFlops;
            metrics.board_name = profilingData.boardName;
        }
        if (modelInfo) {
            metrics.total_parameters = modelInfo.total_parameters;
        }

        await saveModel({
            name: modelName.trim(),
            onnxFile,
            dataFile: dataFile!,
            graphNodes: nodes,
            graphEdges: edges,
            targetChip,
            metrics,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800/50 rounded-2xl p-8 shadow-2xl">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Success state */}
                {saveStatus === 'success' ? (
                    <div className="text-center py-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Model Saved</h3>
                        <p className="text-sm text-zinc-500 mb-6">
                            &ldquo;{modelName}&rdquo; has been saved successfully.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 transition-all"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                <Save className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white tracking-tight">Save Model</h3>
                                <p className="text-xs text-zinc-500">Save to your project library</p>
                            </div>
                        </div>

                        {/* Model name input */}
                        <div className="mb-5">
                            <label className="block text-xs font-medium text-zinc-400 mb-2">
                                Model Name
                            </label>
                            <input
                                type="text"
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                                placeholder="e.g. MNIST Classifier"
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && canSave) handleSave();
                                }}
                            />
                        </div>

                        {/* Model info summary */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/30 text-center">
                                <Cpu className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                                <p className="text-[10px] text-zinc-500">Target</p>
                                <p className="text-xs font-medium text-zinc-300">{targetChip}</p>
                            </div>
                            <div className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/30 text-center">
                                <Layers className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                                <p className="text-[10px] text-zinc-500">Layers</p>
                                <p className="text-xs font-medium text-zinc-300">{nodes.length}</p>
                            </div>
                            <div className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/30 text-center">
                                <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                                <p className="text-[10px] text-zinc-500">Params</p>
                                <p className="text-xs font-medium text-zinc-300">
                                    {modelInfo?.total_parameters
                                        ? modelInfo.total_parameters >= 1000000
                                            ? `${(modelInfo.total_parameters / 1000000).toFixed(1)}M`
                                            : modelInfo.total_parameters >= 1000
                                                ? `${(modelInfo.total_parameters / 1000).toFixed(1)}K`
                                                : modelInfo.total_parameters
                                        : '—'}
                                </p>
                            </div>
                        </div>

                        {/* Error */}
                        {saveStatus === 'error' && error && (
                            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <p className="text-xs text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!canSave}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saveStatus === 'saving' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Model
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
