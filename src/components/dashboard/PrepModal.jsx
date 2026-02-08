
"use client";

import React, { useState } from "react";
import { Users, BookOpen, Loader2, X, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function PrepModal({ isOpen, onClose }) {
    const [developers, setDevelopers] = useState([]);
    const [developer, setDeveloper] = useState("");
    const [context, setContext] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        if (isOpen) {
            fetch("/api/prep/1on1")
                .then(res => res.json())
                .then(data => {
                    if (data.developers) {
                        setDevelopers(data.developers);
                        if (!developer && data.developers.length > 0) {
                            setDeveloper(data.developers[0]);
                        }
                    }
                })
                .catch(err => console.error(err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/prep/1on1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    developer_name: developer,
                    manager_context: context
                }),
            });

            const data = await res.json();

            if (data.status === "error") {
                throw new Error(data.briefing || "Failed to generate briefing.");
            }

            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Users className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">1-on-1 Prep Assistant</h2>
                            <p className="text-sm text-neutral-500">AI-powered briefing for your team meetings</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Input Section */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Select Developer
                                </label>
                                <input
                                    type="text"
                                    value={developer}
                                    onChange={(e) => setDeveloper(e.target.value)}
                                    placeholder="Enter developer name (e.g., Alice)"
                                    className="w-full p-2.5 rounded-lg border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-neutral-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Additional Context (Optional)
                            </label>
                            <textarea
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="e.g., Discussing recent project launch, promotion goals, or blocker resolution..."
                                className="w-full h-24 p-3 rounded-lg border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating Briefing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Briefing
                                </>
                            )}
                        </button>
                    </div>

                    {/* Results Section */}
                    {error && (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="h-px w-full bg-neutral-100 dark:bg-zinc-800" />

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-indigo-500" />
                                    <h3 className="font-semibold text-neutral-900 dark:text-white">Meeting Briefing for {result.developer_name}</h3>
                                </div>

                                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                                    <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed prose dark:prose-invert prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {result.briefing}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {result.talking_points && result.talking_points.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            Key Talking Points
                                        </h4>
                                        <ul className="space-y-2">
                                            {result.talking_points.map((point, i) => (
                                                <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-zinc-800/50 border border-neutral-100 dark:border-zinc-800/50 hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors">
                                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-100 dark:bg-zinc-700 text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-neutral-600 dark:text-neutral-300 text-sm">{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="text-xs text-neutral-400 text-right mt-2">
                                    Generated in {result.elapsed_s?.toFixed(2)}s
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
