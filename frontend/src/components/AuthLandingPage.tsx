'use client';

import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, Sparkles, Cpu } from 'lucide-react';

export function AuthLandingPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
                {/* Logo */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-8 shadow-2xl shadow-violet-500/30">
                    <Zap className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
                    Silicon
                </h1>
                <p className="text-base text-zinc-500 mb-12 max-w-sm leading-relaxed">
                    Neural Network Compiler for Edge Devices
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <button
                        onClick={() => router.push('/signup')}
                        className="group flex items-center justify-between w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-medium hover:from-violet-600 hover:to-indigo-700 transition-all duration-300 shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30"
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5" />
                            <div className="text-left">
                                <span className="block text-sm font-semibold">Start Building</span>
                                <span className="block text-[11px] text-white/60">Create a new account</span>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    <button
                        onClick={() => router.push('/login')}
                        className="group flex items-center justify-between w-full px-6 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/50 text-white font-medium hover:bg-zinc-800/80 hover:border-zinc-700/50 transition-all duration-300"
                    >
                        <div className="flex items-center gap-3">
                            <Cpu className="w-5 h-5 text-violet-400" />
                            <div className="text-left">
                                <span className="block text-sm font-semibold">Continue Optimizing</span>
                                <span className="block text-[11px] text-zinc-500">Sign in to your account</span>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                </div>

                {/* Footer tagline */}
                <p className="mt-12 text-[11px] text-zinc-700 flex items-center gap-1.5">
                    <Cpu className="w-3 h-3" />
                    Compiles to optimized C for STM32 and ESP32
                </p>
            </div>
        </div>
    );
}
