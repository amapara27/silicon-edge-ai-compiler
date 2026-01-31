'use client';

import { DragEvent } from 'react';
import { Circle, Layers, Target, Cpu, Zap } from 'lucide-react';
import { useGraphStore, TargetChip } from '@/store/graphStore';
import { OnnxUploader } from './OnnxUploader';

interface DraggableNodeProps {
    type: string;
    label: string;
    icon: React.ReactNode;
    color: string;
}

function DraggableNode({ type, label, icon, color }: DraggableNodeProps) {
    const onDragStart = (event: DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData('application/reactflow', type);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab
        bg-zinc-800/50 border border-zinc-700/50
        hover:bg-zinc-700/50 hover:border-${color}-500/50
        transition-all duration-200 active:cursor-grabbing
      `}
        >
            <div className={`text-${color}-400`}>{icon}</div>
            <span className="text-sm text-zinc-300">{label}</span>
        </div>
    );
}

export function Sidebar() {
    const { targetChip, setTargetChip, compile, generatedCode } = useGraphStore();

    const chips: TargetChip[] = ['STM32F401', 'ESP32'];

    return (
        <div className="w-64 bg-zinc-900/50 backdrop-blur-sm border-r border-zinc-800 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">Silicon</h1>
                        <p className="text-xs text-zinc-500">Neural Net Compiler</p>
                    </div>
                </div>
            </div>

            {/* ONNX Upload + Node Templates */}
            <div className="p-4 flex-1 overflow-auto">
                {/* ONNX Upload */}
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Import Model
                </h2>
                <OnnxUploader />

                {/* Node Templates */}
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-6 mb-3">
                    Drag to Add
                </h2>
                <div className="space-y-2">
                    <DraggableNode
                        type="inputNode"
                        label="Input Layer"
                        icon={<Circle className="w-4 h-4 fill-current/30" />}
                        color="emerald"
                    />
                    <DraggableNode
                        type="layerNode"
                        label="Dense Layer"
                        icon={<Layers className="w-4 h-4" />}
                        color="slate"
                    />
                    <DraggableNode
                        type="outputNode"
                        label="Output Layer"
                        icon={<Target className="w-4 h-4" />}
                        color="orange"
                    />
                </div>

                {/* Target Chip */}
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-6 mb-3">
                    Target Board
                </h2>
                <div className="space-y-2">
                    {chips.map((chip) => (
                        <button
                            key={chip}
                            onClick={() => setTargetChip(chip)}
                            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200
                ${targetChip === chip
                                    ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                                    : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50'
                                }
              `}
                        >
                            <Cpu className="w-4 h-4" />
                            <span className="text-sm">{chip}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Compile Button */}
            <div className="p-4 border-t border-zinc-800">
                <button
                    onClick={compile}
                    className="
            w-full py-3 px-4 rounded-xl font-semibold
            bg-gradient-to-r from-violet-600 to-indigo-600
            hover:from-violet-500 hover:to-indigo-500
            text-white shadow-lg shadow-violet-500/25
            transition-all duration-200 active:scale-[0.98]
          "
                >
                    {generatedCode ? 'Recompile' : 'Compile to C'}
                </button>
            </div>
        </div>
    );
}
