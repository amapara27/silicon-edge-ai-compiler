'use client';

import { Handle, Position } from '@xyflow/react';
import { Circle } from 'lucide-react';
import { NodeData } from '@/store/graphStore';

interface InputNodeProps {
    data: NodeData;
    selected?: boolean;
}

export function InputNode({ data, selected }: InputNodeProps) {
    return (
        <div
            className={`
        px-4 py-3 rounded-xl bg-zinc-900/90 backdrop-blur-sm
        border-2 transition-all duration-200
        ${selected ? 'border-emerald-400 shadow-lg shadow-emerald-500/25' : 'border-emerald-500/50'}
        min-w-[180px]
      `}
        >
            <div className="flex items-center gap-2 mb-2">
                <Circle className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
                <span className="text-sm font-semibold text-emerald-400">Input Layer</span>
            </div>

            <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Shape</label>
                <div className="px-2 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 font-mono">
                    [{(data.shape as string) || '1, 28, 28'}]
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-emerald-600"
            />
        </div>
    );
}
