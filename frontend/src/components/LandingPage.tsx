'use client';

import { Zap, Plus, Upload, FolderOpen, ArrowRight, Cpu } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import LoginLogoutButton from './ui/LoginLogoutButton';

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
                bg-zinc-900/80 border border-zinc-800/50
                transition-all duration-300 ease-out
                ${disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-zinc-700 hover:bg-zinc-800/60 hover:scale-[1.02] hover:shadow-xl hover:shadow-zinc-900/50 cursor-pointer'
                }
            `}
        >
            {badge && (
                <span className="absolute top-4 right-4 px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-800 text-zinc-500 uppercase tracking-wider">
                    {badge}
                </span>
            )}

            <div className={`
                w-14 h-14 rounded-xl flex items-center justify-center mb-5
                bg-gradient-to-br ${gradient}
                ${!disabled && 'group-hover:scale-110 group-hover:shadow-lg'}
                transition-all duration-300
            `}>
                {icon}
            </div>

            <h3 className="text-lg font-semibold text-white mb-1.5 tracking-tight">{title}</h3>
            <p className="text-xs text-zinc-500 text-center mb-4 leading-relaxed max-w-[200px]">{description}</p>

            {!disabled && (
                <div className="flex items-center gap-1 text-xs text-zinc-600 group-hover:text-violet-400 transition-colors font-medium">
                    Get Started
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
            )}
        </button>
    );
}

export function LandingPage() {
    const { setMode } = useAppStore();

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 relative">
            <div className="absolute top-8 right-8">
                <LoginLogoutButton />
            </div>
            {/* Header */}
            <div className="text-center mb-14">
                <div className="flex items-center justify-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Zap className="w-7 h-7 text-white" />
                    </div>
                </div>
                <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">
                    Silicon
                </h1>
                <p className="text-sm text-zinc-500 tracking-wide">
                    Neural Network Compiler for Edge Devices
                </p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl w-full">
                <OptionCard
                    title="Build New"
                    description="Create a neural network from scratch with our visual editor"
                    icon={<Plus className="w-7 h-7 text-white" />}
                    gradient="from-emerald-500 to-teal-600"
                    onClick={() => setMode('build-new')}
                />

                <OptionCard
                    title="Import Model"
                    description="Upload an ONNX model to visualize and compile"
                    icon={<Upload className="w-7 h-7 text-white" />}
                    gradient="from-violet-500 to-indigo-600"
                    onClick={() => setMode('import-existing')}
                />

                <OptionCard
                    title="Load Previous"
                    description="No saved models available"
                    icon={<FolderOpen className="w-7 h-7 text-white" />}
                    gradient="from-zinc-600 to-zinc-700"
                    onClick={() => setMode('load-previous')}
                    disabled={true}
                    badge="Soon"
                />
            </div>

            {/* Footer */}
            <div className="mt-14 flex items-center gap-2 text-zinc-700 text-xs tracking-wide">
                <Cpu className="w-3.5 h-3.5" />
                <span>Compiles to optimized C for STM32 and ESP32</span>
            </div>
        </div>
    );
}

