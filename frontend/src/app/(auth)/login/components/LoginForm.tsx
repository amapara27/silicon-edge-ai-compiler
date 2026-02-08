import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth-actions";
import SignInWithGoogleButton from "./SignInWithGoogleButton";

export function LoginForm() {
    return (
        <div className="w-full max-w-sm">
            <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-8 backdrop-blur-sm">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white tracking-tight">Welcome back</h2>
                    <p className="text-sm text-zinc-500 mt-1">Enter your credentials to sign in</p>
                </div>

                <form action="">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm text-zinc-400">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-600 focus:border-violet-500 focus:ring-violet-500/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm text-zinc-400">Password</Label>
                                <Link
                                    href="#"
                                    className="text-xs text-zinc-500 hover:text-violet-400 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-zinc-800/50 border-zinc-700/50 text-white focus:border-violet-500 focus:ring-violet-500/20"
                            />
                        </div>

                        <button
                            type="submit"
                            formAction={login}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-medium hover:from-violet-600 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
                        >
                            Sign in
                        </button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-zinc-900 px-3 text-zinc-600">or continue with</span>
                            </div>
                        </div>

                        <SignInWithGoogleButton />
                    </div>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-500">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-violet-400 hover:text-violet-300 transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}