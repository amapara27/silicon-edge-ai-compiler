'use client';

import { Handle, Position } from '@xyflow/react';
import { Layers } from 'lucide-react';
import { NodeData } from '@/store/graphStore';

const layerTypeLabels: Record<string, string> = {
    dense: 'Dense',
    conv2d: 'Conv2D',
    relu: 'ReLU',
    softmax: 'Softmax',
};

interface LayerNodeProps {
    data: NodeData;
    selected?: boolean;
}

export function LayerNode({ data, selected }: LayerNodeProps) {
    const layerType = (data.type as string) || 'dense';

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
                <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Type</label>
                    <div className="px-2 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-zinc-300">
                        {layerTypeLabels[layerType] || layerType}
                    </div>
                </div>

                {(layerType === 'dense') && (
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Neurons</label>
                        <div className="px-2 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-violet-400 font-mono">
                            {(data.units as number) || 128}
                        </div>
                    </div>
                )}

                {(layerType === 'conv2d') && (
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Kernel Size</label>
                        <div className="px-2 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-violet-400 font-mono">
                            {(data.kernelSize as number) || 3}x{(data.kernelSize as number) || 3}
                        </div>
                    </div>
                )}

                {data.activation && (
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Activation</label>
                        <div className="px-2 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-amber-400 font-mono">
                            {data.activation as string}
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
