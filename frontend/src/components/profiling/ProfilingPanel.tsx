'use client';

import { useEffect } from 'react';
import { Activity, Cpu, Loader2 } from 'lucide-react';
import { useProfilingStore } from '@/store/profilingStore';
import { useGraphStore } from '@/store/graphStore';
import { ProfileMetrics } from './ProfileMetrics';
import { LayerTable } from './LayerTable';

export function ProfilingPanel() {
    const { profilingData, isLoading, loadPlaceholderData } = useProfilingStore();
    const { targetChip } = useGraphStore();

    // Load placeholder data when target chip changes
    useEffect(() => {
        loadPlaceholderData(targetChip);
    }, [targetChip, loadPlaceholderData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                <p className="text-xs text-zinc-500">Analyzing model...</p>
            </div>
        );
    }

    if (!profilingData) {
        return (
            <div className="p-4 text-center">
                <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No profiling data</p>
                <p className="text-xs text-zinc-600 mt-1">Upload a model to see profiling results</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Profiling Results
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-500/20 rounded-md border border-violet-500/30">
                    <Cpu className="w-3 h-3 text-violet-400" />
                    <span className="text-[10px] font-medium text-violet-300">
                        {profilingData.boardName}
                    </span>
                </div>
            </div>

            {/* Resource Metrics */}
            <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                <ProfileMetrics
                    ramUsed={profilingData.ramUsed}
                    ramTotal={profilingData.ramTotal}
                    flashUsed={profilingData.flashUsed}
                    flashTotal={profilingData.flashTotal}
                    totalFlops={profilingData.totalFlops}
                />
            </div>

            {/* Layer Breakdown */}
            <div>
                <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Layer Breakdown
                </h4>
                <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/50 overflow-hidden">
                    <LayerTable layers={profilingData.layers} />
                </div>
            </div>
        </div>
    );
}
