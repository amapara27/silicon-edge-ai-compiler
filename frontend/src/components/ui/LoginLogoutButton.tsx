"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { signout } from "@/lib/auth-actions";
import { LogIn, LogOut, User } from "lucide-react";

const LoginLogoutButton = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="h-9 w-20 bg-zinc-800/50 rounded-lg animate-pulse" />
        );
    }

    if (user) {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={() => router.push('/profile')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-white transition-all duration-200"
                    title="My Profile"
                >
                    <User className="w-4 h-4" />
                </button>
                <button
                    onClick={() => {
                        signout();
                        setUser(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-white transition-all duration-200"
                >
                    <LogOut className="w-4 h-4" />
                    Log out
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => {
                router.push("/login");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-violet-500/20"
        >
            <LogIn className="w-4 h-4" />
            Sign in
        </button>
    );
};

export default LoginLogoutButton;