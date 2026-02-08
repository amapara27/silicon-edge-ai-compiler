'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const LogoutPage = () => {
    const router = useRouter();
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push("/");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-white tracking-tight">Silicon</span>
            </Link>

            {/* Card */}
            <div className="w-full max-w-sm">
                <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-8 backdrop-blur-sm text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-7 h-7 text-emerald-400" />
                    </div>

                    <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
                        Signed out successfully
                    </h2>
                    <p className="text-sm text-zinc-500 mb-6">
                        Thanks for using Silicon. See you next time!
                    </p>

                    <div className="text-xs text-zinc-600">
                        Redirecting to home in{" "}
                        <span className="text-violet-400 font-medium">{countdown}s</span>
                    </div>
                </div>
            </div>

            {/* Manual redirect */}
            <div className="mt-8">
                <Link
                    href="/"
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                    ← Back to home now
                </Link>
            </div>
        </div>
    );
};

export default LogoutPage;