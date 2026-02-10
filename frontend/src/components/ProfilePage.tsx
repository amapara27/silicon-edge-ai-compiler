'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import {
    Zap, ArrowLeft, User, Mail, Calendar,
    Cpu, FlaskConical, Layers, Hash,
    FolderOpen, ArrowRight, Clock, MoreVertical,
} from 'lucide-react';
import { signout } from '@/lib/auth-actions';

// ── Placeholder data (will be replaced with Supabase queries later) ──

const PLACEHOLDER_STATS = [
    { label: 'Models Uploaded', value: '3', icon: Layers, color: 'from-violet-500 to-indigo-600' },
    { label: 'Builds Done', value: '12', icon: Cpu, color: 'from-emerald-500 to-teal-600' },
    { label: 'Test Bench Inferences', value: '47', icon: FlaskConical, color: 'from-amber-500 to-orange-600' },
    { label: 'Total Params Compiled', value: '1.2M', icon: Hash, color: 'from-rose-500 to-pink-600' },
];

const PLACEHOLDER_PROJECTS = [
    {
        id: '1',
        name: 'MNIST Classifier',
        targetChip: 'STM32F401',
        params: '109,386',
        updatedAt: '2 days ago',
    },
    {
        id: '2',
        name: 'Gesture Recognition',
        targetChip: 'ESP32-S3',
        params: '45,210',
        updatedAt: '1 week ago',
    },
    {
        id: '3',
        name: 'Anomaly Detector',
        targetChip: 'STM32F401',
        params: '23,764',
        updatedAt: '3 weeks ago',
    },
];

// ── Sub-components ──

function StatCard({ label, value, icon: Icon, color }: {
    label: string; value: string; icon: React.ElementType; color: string;
}) {
    return (
        <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                <p className="text-xs text-zinc-500 mt-1">{label}</p>
            </div>
        </div>
    );
}

function ProjectCard({ name, targetChip, params, updatedAt }: {
    name: string; targetChip: string; params: string; updatedAt: string;
}) {
    return (
        <div className="group bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm hover:border-zinc-700 hover:bg-zinc-800/60 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700/50">
                    <FolderOpen className="w-5 h-5 text-zinc-400" />
                </div>
                <button className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            <h3 className="text-sm font-semibold text-white tracking-tight mb-1">{name}</h3>

            <div className="flex items-center gap-3 mt-3 mb-4">
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {targetChip}
                </span>
                <span className="text-[10px] text-zinc-600">{params} params</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                    <Clock className="w-3 h-3" />
                    {updatedAt}
                </div>
                <button
                    disabled
                    className="flex items-center gap-1 text-[11px] font-medium text-zinc-600 group-hover:text-violet-400 transition-colors opacity-50 cursor-not-allowed"
                >
                    Load
                    <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

// ── Main component ──

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const fullName = user?.user_metadata?.full_name || 'Silicon User';
    const email = user?.email || 'user@example.com';
    const initial = fullName.charAt(0).toUpperCase();
    const joinedDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Recently';

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Top bar */}
            <div className="border-b border-zinc-800/50">
                <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                            <Zap className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="text-lg font-semibold text-white tracking-tight">Silicon</span>
                    </Link>

                    <Link
                        href="/"
                        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to editor
                    </Link>
                </div>
            </div>

            {/* Page content */}
            <div className="max-w-5xl mx-auto px-8 py-10">

                {/* ── User header ── */}
                <div className="flex items-center gap-6 mb-10">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-violet-500/20">
                        {initial}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white tracking-tight">{fullName}</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
                                <Mail className="w-3.5 h-3.5" />
                                {email}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-zinc-600">
                                <Calendar className="w-3.5 h-3.5" />
                                Joined {joinedDate}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => signout()}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white transition-all duration-200"
                    >
                        Sign out
                    </button>
                </div>

                {/* ── Stats grid ── */}
                <div className="mb-10">
                    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Usage Stats</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {PLACEHOLDER_STATS.map((stat) => (
                            <StatCard key={stat.label} {...stat} />
                        ))}
                    </div>
                </div>

                {/* ── Saved projects ── */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Saved Projects</h2>
                        <span className="text-xs text-zinc-600">
                            {PLACEHOLDER_PROJECTS.length} projects
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PLACEHOLDER_PROJECTS.map((project) => (
                            <ProjectCard key={project.id} {...project} />
                        ))}
                    </div>
                    <p className="text-center text-xs text-zinc-700 mt-6">
                        Database integration coming soon — projects shown above are placeholders.
                    </p>
                </div>
            </div>
        </div>
    );
}
