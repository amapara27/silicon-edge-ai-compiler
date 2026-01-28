'use client';

import { Handle, Position } from '@xyflow/react';
import { Target } from 'lucide-react';
import { NodeData } from '@/store/graphStore';

interface OutputNodeProps {
    data: NodeData;
    selected?: boolean;
}

export function OutputNode({ data, selected }: OutputNodeProps) {
    return (
        <div
            className={`
        px-4 py-3 rounded-xl bg-zinc-900/90 backdrop-blur-sm
        border-2 transition-all duration-200
        ${selected ? 'border-orange-400 shadow-lg shadow-orange-500/25' : 'border-orange-500/50'}
        min-w-[180px]
      `}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-orange-400 !border-2 !border-orange-600"
            />

            <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-orange-400">Output Layer</span>
            </div>

            <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Classes</label>
                <div className="px-2 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-orange-300 font-mono">
                    {(data.classes as number) || 10}
                </div>
            </div>
        </div>
    );
}
