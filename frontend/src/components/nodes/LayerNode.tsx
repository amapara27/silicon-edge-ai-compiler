'use client';

import { Handle, Position } from '@xyflow/react';
import { Layers, Zap } from 'lucide-react';
import { NodeData } from '@/store/graphStore';

const layerTypeLabels: Record<string, string> = {
    dense: 'Dense',
    conv2d: 'Conv2D',
    relu: 'ReLU',
    softmax: 'Softmax',
    sigmoid: 'Sigmoid',
    tanh: 'Tanh',
};

// Activation types that should render as compact nodes
const ACTIVATION_TYPES = ['relu', 'sigmoid', 'tanh', 'softmax', 'leakyrelu'];

interface LayerNodeProps {
    data: NodeData;
    selected?: boolean;
}

export function LayerNode({ data, selected }: LayerNodeProps) {
    const layerType = (data.type as string) || 'dense';
    const hasData = Boolean(data.inputShape || data.outputShape || data.params);
    const isActivation = ACTIVATION_TYPES.includes(layerType.toLowerCase());

    // Compact activation node (no shape/params)
    if (isActivation && !hasData) {
        return (
            <div
                className={`
                    px-3 py-2 rounded-lg bg-zinc-900/90 backdrop-blur-sm
                    border transition-all duration-200
                    ${selected ? 'border-amber-400 shadow-md shadow-amber-500/20' : 'border-amber-500/40'}
                `}
            >
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!w-2 !h-2 !bg-amber-400 !border !border-amber-600"
                />
                <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-medium text-amber-300">
                        {layerTypeLabels[layerType] || layerType}
                    </span>
                </div>
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-2 !h-2 !bg-amber-400 !border !border-amber-600"
                />
            </div>
        );
    }

    // Full layer node with data
    return (
        <div
            className={`
                px-4 py-3 rounded-xl bg-zinc-900/90 backdrop-blur-sm
                border-2 transition-all duration-200
                ${selected ? 'border-slate-400 shadow-lg shadow-slate-500/25' : 'border-slate-500/50'}
                min-w-[180px]
            `}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600"
            />

            <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-300">
                    {layerTypeLabels[layerType] || 'Layer'}
                </span>
            </div>

            <div className="space-y-2">
                {Boolean(data.inputShape || data.outputShape) && (
                    <div className="flex gap-2">
                        {Boolean(data.inputShape) && (
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 uppercase tracking-wider">In</label>
                                <div className="px-2 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-cyan-400 font-mono">
                                    {String(data.inputShape)}
                                </div>
                            </div>
                        )}
                        {Boolean(data.outputShape) && (
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 uppercase tracking-wider">Out</label>
                                <div className="px-2 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-violet-400 font-mono">
                                    {String(data.outputShape)}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {data.params != null && (
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Params</label>
                        <div className="px-2 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-emerald-400 font-mono">
                            {(data.params as number) >= 1000
                                ? `${((data.params as number) / 1000).toFixed(1)}K`
                                : String(data.params)}
                        </div>
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600"
            />
        </div>
    );
}
