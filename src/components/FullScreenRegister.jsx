"use client";

import { SunIcon as Sunburst } from "lucide-react";
import { useState } from "react";
import { WavyBackground } from "./ui/wavy-background";
import { ShaderAnimation } from "@/components/shader-lines";

export default function FullScreenRegister() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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

        if (!name.trim()) {
            valid = false;
        }

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
            console.log("Registration Submitted:", { name, email, password });
            alert(`Account created for ${name}! Please sign in.`);
            setSubmitted(false);
        }
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
                        Join the future of Agentic AI.
                    </h1>
                </div>

                {/* Right Side: Form */}
                <div className="p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-center bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 z-10 relative">
                    <div className="flex flex-col items-start mb-6">
                        <div className="text-orange-500 mb-4 bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                            <Sunburst className="h-8 w-8" />
                        </div>
                        <h2 className="text-3xl font-semibold mb-2 tracking-tight">
                            Create Account
                        </h2>
                        <p className="text-left text-zinc-500 dark:text-zinc-400">
                            Get started with Endurance today.
                        </p>
                    </div>

                    <form
                        className="flex flex-col gap-4"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1.5 ml-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                placeholder="John Doe"
                                className={`text-sm w-full py-2.5 px-4 border rounded-xl focus:outline-none focus:ring-2 bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-700 transition-all border-zinc-200 focus:border-orange-500 focus:ring-orange-100 dark:focus:ring-orange-900/50`}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1.5 ml-1">
                                Your email
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="hi@endurance.ai"
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
                                placeholder="••••••••"
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
                            Sign Up
                        </button>

                        <div className="text-center text-zinc-500 text-xs mt-4">
                            Already have an account?{" "}
                            <a href="/login" className="text-orange-600 hover:text-orange-700 font-medium underline underline-offset-4">
                                Sign in
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </WavyBackground>
    );
};
