"use client";

import { EnduranceLogo } from "@/components/ui/EnduranceLogo";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { WavyBackground } from "./ui/wavy-background";
import { ShaderAnimation } from "@/components/shader-lines";

export default function FullScreenSignup() {
    const router = useRouter();
    // Hardcoded test credentials pre-filled
    const [email, setEmail] = useState("admin@endurance.ai");
    const [password, setPassword] = useState("password123");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const validateEmail = (value) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    const validatePassword = (value) => {
        return value.length >= 8;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let valid = true;

        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address.");
            valid = false;
        } else {
            setEmailError("");
        }

        if (!validatePassword(password)) {
            setPasswordError("Password must be at least 8 characters.");
            valid = false;
        } else {
            setPasswordError("");
        }

        setSubmitted(true);

        if (valid) {
            // Role-based Redirect Logic
            if (password === "password123") {
                if (email === "hr@endurance.ai") {
                    console.log("Login Successful: HR");
                    router.push('/dashboard?role=HR');
                } else if (email === "lead@endurance.ai") {
                    console.log("Login Successful: Team Lead");
                    router.push('/dashboard?role=LEAD');
                } else if (email === "dev@endurance.ai") {
                    console.log("Login Successful: Developer");
                    router.push('/dashboard?role=DEV');
                } else if (email === "admin@endurance.ai" || email === "admin@example.com") {
                    console.log("Login Successful: Admin");
                    router.push('/dashboard?role=ADMIN');
                } else {
                    alert("Invalid Credentials. Try: admin@endurance.ai / hr@endurance.ai / lead@endurance.ai / dev@endurance.ai");
                }
            } else {
                alert("Invalid Password (Try: password123)");
            }
            setSubmitted(false);
        }
    };

    const fillCredentials = (roleEmail) => {
        setEmail(roleEmail);
        setPassword("password123");
    };

    return (
        <WavyBackground
            className="max-w-5xl mx-auto w-full"
            containerClassName="min-h-screen p-4"
            colors={["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ea580c"]}
            colorsLight={["#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c"]}
            backgroundFill="#09090b"
            backgroundFillLight="#fafafa"
            blur={12}
            speed="slow"
            waveOpacity={0.6}
        >
            <div className="w-full relative overflow-hidden flex flex-col md:flex-row shadow-2xl rounded-3xl border border-white/10 z-10">
                {/* Left Side: Brand/Hero with ShaderAnimation */}
                <div className="bg-zinc-900 text-white p-8 md:p-12 w-full md:w-1/2 relative flex flex-col justify-end z-10 min-h-[200px] md:min-h-[500px]">
                    {/* Shader Animation Background */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <ShaderAnimation />
                    </div>

                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-[1]"></div>

                    {/* Decorative Orange Orb */}
                    <div className="w-[20rem] h-[20rem] bg-orange-500 absolute z-[1] rounded-full -bottom-20 -left-10 blur-[80px] opacity-60 pointer-events-none"></div>

                    <h1 className="text-2xl md:text-3xl font-medium leading-tight z-10 tracking-tight relative text-balance">
                        Automate your workflow with Endurance.
                    </h1>
                </div>

                {/* Right Side: Form */}
                <div className="p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-center bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 z-10 relative">
                    <div className="flex flex-col items-start mb-8">
                        <div className="text-orange-500 mb-4 bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                            <EnduranceLogo className="h-8 w-8" />
                        </div>
                        <h2 className="text-3xl font-semibold mb-2 tracking-tight">
                            Welcome Back
                        </h2>
                        <p className="text-left text-zinc-500 dark:text-zinc-400">
                            Sign in to your Endurance dashboard.
                        </p>
                    </div>

                    <form
                        className="flex flex-col gap-4"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1.5 ml-1">
                                Your email
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="hello@endurance.ai"
                                className={`text-sm w-full py-2.5 px-4 border rounded-xl focus:outline-none focus:ring-2 bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-700 transition-all ${emailError
                                    ? "border-red-500 focus:ring-red-200"
                                    : "border-zinc-200 focus:border-orange-500 focus:ring-orange-100 dark:focus:ring-orange-900/50"
                                    }`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {emailError && (
                                <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                                    {emailError}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1.5 ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                className={`text-sm w-full py-2.5 px-4 border rounded-xl focus:outline-none focus:ring-2 bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-700 transition-all ${passwordError
                                    ? "border-red-500 focus:ring-red-200"
                                    : "border-zinc-200 focus:border-orange-500 focus:ring-orange-100 dark:focus:ring-orange-900/50"
                                    }`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {passwordError && (
                                <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                                    {passwordError}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] mt-2"
                        >
                            Sign In
                        </button>

                        {/* Quick Login Helpers */}
                        <div className="flex flex-wrap gap-2 mt-4 justify-center">
                            <button type="button" onClick={() => fillCredentials("admin@endurance.ai")} className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">Admin</button>
                            <button type="button" onClick={() => fillCredentials("hr@endurance.ai")} className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">HR</button>
                            <button type="button" onClick={() => fillCredentials("lead@endurance.ai")} className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">Lead</button>
                            <button type="button" onClick={() => fillCredentials("dev@endurance.ai")} className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">Dev</button>
                        </div>

                        <div className="text-center text-zinc-500 text-xs mt-2">
                            Don't have an account?{" "}
                            <a href="/signup" className="text-orange-600 hover:text-orange-700 font-medium underline underline-offset-4">
                                Sign up
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </WavyBackground>
    );
};
