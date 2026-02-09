'use client';

import Link from "next/link";
import { Zap, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-white tracking-tight">Silicon</span>
            </Link>

            {/* Error Card */}
            <div className="w-full max-w-md">
                <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-10 backdrop-blur-sm text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-orange-400" />
                    </div>

                    <h1 className="text-2xl font-bold text-white tracking-tight mb-3">
                        Something went wrong
                    </h1>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        We encountered an unexpected error. This might be due to a session timeout or a temporary connection issue.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => window.location.reload()}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try again
                        </Button>
                        <Link href="/" className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-500/20">
                                Back to home
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Help text */}
            <p className="mt-12 text-sm text-zinc-600">
                If the problem persists, please contact support.
            </p>
        </div>
    );
}