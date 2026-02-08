"use client";

import React, { useState } from "react";
import { Sparkles, Send, Bot, User } from "lucide-react";

export function InsightPanel({ context }) {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        { role: "assistant", content: "Hello! I'm Endurance AI. Ask me anything about your team's engineering data." }
    ]);

    async function handleAsk(e) {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = { role: "user", content: query };
        setChatHistory(prev => [...prev, userMsg]);
        setQuery("");
        setLoading(true);

        try {
            const res = await fetch('/api/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMsg.content,
                    context: context // Pass dashboard metrics as context
                })
            });
            const data = await res.json();

            setChatHistory(prev => [...prev, {
                role: "assistant",
                content: data.aiResponse || "I couldn't generate an answer at this time.",
                sources: data.sources
            }]);
        } catch (err) {
            setChatHistory(prev => [...prev, {
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again."
            }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-neutral-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200/60 dark:border-zinc-800/60 bg-neutral-50/50 dark:bg-zinc-900/50 flex items-center gap-3">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Endurance AI Insight</h3>
                    <p className="text-[10px] text-neutral-500">Powered by Featherless Mistral-7B</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-zinc-700">
                {chatHistory.map((msg, idx) => {
                    // Start: Process content to separate <think> blocks
                    let displayContent = msg.content;
                    let thoughtContent = null;

                    if (msg.role === 'assistant') {
                        const thinkMatch = msg.content.match(/<think>([\s\S]*?)<\/think>/);
                        if (thinkMatch) {
                            thoughtContent = thinkMatch[1].trim();
                            displayContent = msg.content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
                        }
                    }
                    // End: Process content

                    return (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-orange-500 to-red-500 text-white'}`}>
                                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div className={`rounded-2xl p-3.5 max-w-[85%] text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-zinc-800 border border-neutral-100 dark:border-zinc-700 text-neutral-800 dark:text-neutral-200 rounded-tl-sm'}`}>
                                {thoughtContent && (
                                    <details className="mb-2 group">
                                        <summary className="cursor-pointer text-[10px] font-medium text-neutral-400 hover:text-orange-500 flex items-center gap-1 transition-colors select-none">
                                            <Zap size={10} />
                                            <span>AI Thought Process</span>
                                        </summary>
                                        <div className="mt-2 p-2 bg-neutral-50 dark:bg-black/20 rounded text-[10px] text-neutral-500 dark:text-neutral-400 italic border-l-2 border-orange-300/50 pl-3">
                                            {thoughtContent}
                                        </div>
                                    </details>
                                )}
                                <p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>
                                {msg.sources && (
                                    <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px] opacity-70 flex flex-wrap gap-1">
                                        <span className="font-medium opacity-70">Sources:</span>
                                        {msg.sources.map((src, i) => (
                                            <span key={i} className="bg-black/5 dark:bg-white/10 px-1 rounded">{src}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {loading && (
                    <div className="flex gap-3 animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Bot size={14} />
                        </div>
                        <div className="bg-white dark:bg-zinc-800 border border-neutral-100 dark:border-zinc-700 p-3.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleAsk} className="p-3 bg-white dark:bg-zinc-900 border-t border-neutral-200/60 dark:border-zinc-800/60">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask about team velocity, blockers, or deployments..."
                        className="w-full pl-4 pr-12 py-2.5 rounded-lg border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-neutral-400"
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="absolute right-1.5 p-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors shadow-sm"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </form>
        </div>
    );
}
