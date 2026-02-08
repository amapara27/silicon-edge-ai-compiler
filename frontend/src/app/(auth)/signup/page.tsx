import { Zap } from 'lucide-react';
import Link from 'next/link';
import { SignUpForm } from './components/SignUpForm';

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
            {/* Header */}
            <div className="text-center mb-10">
                <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-semibold text-white tracking-tight">Silicon</span>
                </Link>
                <p className="text-sm text-zinc-500">Create an account to get started</p>
            </div>

            {/* Form */}
            <SignUpForm />

            {/* Footer */}
            <div className="mt-8">
                <Link
                    href="/"
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                    ← Back to home
                </Link>
            </div>
        </div>
    );
}