import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/lib/auth-actions";

export function SignUpForm() {
    return (
        <div className="w-full max-w-sm">
            <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-8 backdrop-blur-sm">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white tracking-tight">Create account</h2>
                    <p className="text-sm text-zinc-500 mt-1">Enter your details to get started</p>
                </div>

                <form action="">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="first-name" className="text-sm text-zinc-400">First name</Label>
                                <Input
                                    name="first-name"
                                    id="first-name"
                                    placeholder="John"
                                    required
                                    className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-violet-500 focus:ring-violet-500/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last-name" className="text-sm text-zinc-400">Last name</Label>
                                <Input
                                    name="last-name"
                                    id="last-name"
                                    placeholder="Doe"
                                    required
                                    className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-violet-500 focus:ring-violet-500/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm text-zinc-400">Email</Label>
                            <Input
                                name="email"
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-violet-500 focus:ring-violet-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm text-zinc-400">Password</Label>
                            <Input
                                name="password"
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-violet-500 focus:ring-violet-500/20"
                            />
                        </div>

                        <button
                            formAction={signup}
                            type="submit"
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-medium hover:from-violet-600 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
                        >
                            Create account
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-500">
                    Already have an account?{" "}
                    <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
