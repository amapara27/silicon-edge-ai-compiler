'use client';

import { DragEvent } from 'react';
import { Circle, Layers, Target, Cpu, Zap, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGraphStore, TargetChip } from '@/store/graphStore';
import { useAppStore } from '@/store/appStore';
import { useUploadStore } from '@/store/uploadStore';
import { OnnxUploader } from './OnnxUploader';
import { ImportModelModal } from './ImportModelModal';

interface DraggableNodeProps {
    type: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    collapsed?: boolean;
}

function DraggableNode({ type, label, icon, color, collapsed }: DraggableNodeProps) {
    const onDragStart = (event: DragEvent<HTMLDivElement>) => {
        event.dataTransfer.setData('application/reactflow', type);
        event.dataTransfer.effectAllowed = 'move';
    };

    if (collapsed) {
        return (
            <div
                draggable
                onDragStart={onDragStart}
                className={`
                    flex items-center justify-center p-2 rounded-lg cursor-grab
                    bg-zinc-800/50 border border-zinc-700/50
                    hover:bg-zinc-700/50 hover:border-${color}-500/50
                    transition-all duration-200 active:cursor-grabbing
                `}
                title={label}
            >
                <div className={`text-${color}-400`}>{icon}</div>
            </div>
        );
    }

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

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    const { targetChip, setTargetChip } = useGraphStore();
    const { mode } = useAppStore();
    const { modelInfo, compileModel, compileStatus, compiledSourceCode, onnxFileName } = useUploadStore();

    const chips: TargetChip[] = ['STM32F401', 'ESP32'];
    const isImportMode = mode === 'import-existing';
    const isModelLoaded = modelInfo !== null;
    const isCompiling = compileStatus === 'compiling';
    const hasCompiledCode = compileStatus === 'success' && compiledSourceCode !== null;

    const handleCompile = () => {
        const modelName = onnxFileName?.replace('.onnx', '') || 'model';
        compileModel(modelName, targetChip);
    };

    return (
        <div className={`
            relative bg-zinc-900/50 backdrop-blur-sm border-r border-zinc-800 flex flex-col
            transition-all duration-300 ease-in-out
            ${collapsed ? 'w-16' : 'w-64'}
        `}>
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="
                    absolute -right-3 top-1/2 -translate-y-1/2 z-10
                    w-6 h-12 flex items-center justify-center
                    bg-zinc-800 border border-zinc-700 rounded-r-lg
                    hover:bg-zinc-700 transition-colors
                "
            >
                {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                ) : (
                    <ChevronLeft className="w-4 h-4 text-zinc-400" />
                )}
            </button>

            {/* Header */}
            <div className={`p-4 border-b border-zinc-800 ${collapsed ? 'px-3' : ''}`}>
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-lg font-semibold text-white tracking-tight">Silicon</h1>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Neural Compiler</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Content based on mode */}
            <div className={`flex-1 overflow-auto ${collapsed ? 'p-2' : 'p-4'}`}>
                {isImportMode ? (
                    <>
                        {!collapsed && (
                            <h2 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3">
                                Import Model
                            </h2>
                        )}
                        {!collapsed && <ImportModelModal />}
                    </>
                ) : (
                    <>
                        {!collapsed && (
                            <>
                                <h2 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3">
                                    Import Model
                                </h2>
                                <OnnxUploader />
                            </>
                        )}

                        {/* Node Templates */}
                        {!collapsed && (
                            <h2 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-6 mb-3">
                                Drag to Add
                            </h2>
                        )}
                        <div className={`space-y-2 ${collapsed ? 'mt-2' : ''}`}>
                            <DraggableNode
                                type="inputNode"
                                label="Input Layer"
                                icon={<Circle className="w-4 h-4 fill-current/30" />}
                                color="emerald"
                                collapsed={collapsed}
                            />
                            <DraggableNode
                                type="layerNode"
                                label="Dense Layer"
                                icon={<Layers className="w-4 h-4" />}
                                color="slate"
                                collapsed={collapsed}
                            />
                            <DraggableNode
                                type="outputNode"
                                label="Output Layer"
                                icon={<Target className="w-4 h-4" />}
                                color="orange"
                                collapsed={collapsed}
                            />
                        </div>
                    </>
                )}

                {/* Target Chip */}
                {!collapsed && (
                    <h2 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-6 mb-3">
                        Target Board
                    </h2>
                )}
                <div className={`space-y-2 ${collapsed ? 'mt-4' : ''}`}>
                    {chips.map((chip) => (
                        <button
                            key={chip}
                            onClick={() => setTargetChip(chip)}
                            className={`
                                w-full flex items-center rounded-lg
                                transition-all duration-200
                                ${collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'}
                                ${targetChip === chip
                                    ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                                    : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50'
                                }
                            `}
                            title={collapsed ? chip : undefined}
                        >
                            <Cpu className="w-4 h-4" />
                            {!collapsed && <span className="text-sm">{chip}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Compile Button */}
            <div className={`border-t border-zinc-800 ${collapsed ? 'p-2' : 'p-4'}`}>
                <button
                    onClick={handleCompile}
                    disabled={!isModelLoaded || isCompiling}
                    className={`
                        w-full rounded-xl font-medium
                        transition-all duration-200 active:scale-[0.98]
                        flex items-center justify-center gap-2
                        ${collapsed ? 'py-2 px-2' : 'py-3 px-4'}
                        ${isModelLoaded && !isCompiling
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }
                    `}
                    title={collapsed ? (isCompiling ? 'Compiling...' : 'Compile to C') : undefined}
                >
                    {isCompiling ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {!collapsed && 'Compiling...'}
                        </>
                    ) : hasCompiledCode ? (
                        !collapsed && 'Recompile'
                    ) : (
                        !collapsed && 'Compile'
                    )}
                    {collapsed && !isCompiling && <Zap className="w-4 h-4" />}
                </button>
                {!isModelLoaded && !collapsed && (
                    <p className="text-[10px] text-zinc-600 text-center mt-2">Upload a model first</p>
                )}
            </div>
        </div>
    );
}


