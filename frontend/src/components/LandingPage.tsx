'use client';

import { Zap, Plus, Upload, FolderOpen, ArrowRight, Database } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

interface OptionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    onClick: () => void;
    disabled?: boolean;
    badge?: string;
}

function OptionCard({ title, description, icon, gradient, onClick, disabled, badge }: OptionCardProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                group relative flex flex-col items-center p-8 rounded-2xl
                bg-zinc-900/50 backdrop-blur-sm border border-zinc-800
                transition-all duration-300 ease-out
                ${disabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border-zinc-700 hover:bg-zinc-800/50 hover:scale-[1.02] hover:shadow-2xl cursor-pointer'
                }
            `}
        >
            {badge && (
                <span className="absolute top-4 right-4 px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-700/50 text-zinc-400">
                    {badge}
                </span>
            )}

            <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center mb-6
                bg-gradient-to-br ${gradient}
                ${!disabled && 'group-hover:scale-110 group-hover:shadow-lg'}
                transition-all duration-300
            `}>
                {icon}
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-zinc-400 text-center mb-4">{description}</p>

            {!disabled && (
                <div className="flex items-center gap-1 text-sm text-zinc-500 group-hover:text-violet-400 transition-colors">
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            )}
        </button>
    );
}

export function LandingPage() {
    const { setMode } = useAppStore();

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
            {/* Header */}
            <div className="text-center mb-16">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">
                    Silicon
                </h1>
                <p className="text-lg text-zinc-400">
                    Neural Network Compiler for Edge Devices
                </p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                <OptionCard
                    title="Build New Model"
                    description="Create a neural network from scratch using our drag-and-drop playground"
                    icon={<Plus className="w-8 h-8 text-white" />}
                    gradient="from-emerald-500 to-teal-600"
                    onClick={() => setMode('build-new')}
                />

                <OptionCard
                    title="Import Existing Model"
                    description="Upload an ONNX model and data file to visualize and compile"
                    icon={<Upload className="w-8 h-8 text-white" />}
                    gradient="from-violet-500 to-indigo-600"
                    onClick={() => setMode('import-existing')}
                />

                <OptionCard
                    title="Load Previous Model"
                    description="No saved models for now"
                    icon={<FolderOpen className="w-8 h-8 text-white" />}
                    gradient="from-amber-500 to-orange-600"
                    onClick={() => setMode('load-previous')}
                    disabled={true}
                    badge="Coming Soon"
                />
            </div>

            {/* Footer */}
            <div className="mt-16 flex items-center gap-2 text-zinc-600 text-sm">
                <Database className="w-4 h-4" />
                <span>Compiles to optimized C code for STM32 and ESP32</span>
            </div>
        </div>
    );
}
