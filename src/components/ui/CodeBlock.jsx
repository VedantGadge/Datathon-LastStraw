"use client";

import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

// Custom Orange Theme for Code
const orangeTheme = {
    ...vscDarkPlus,
    'code[class*="language-"]': {
        ...vscDarkPlus['code[class*="language-"]'],
        background: 'transparent',
        color: '#e5e5e5', // Default text color
    },
    'pre[class*="language-"]': {
        ...vscDarkPlus['pre[class*="language-"]'],
        background: 'transparent',
        textShadow: 'none',
    },
    // Customize specific tokens to be Orange
    'string': { color: '#fb923c' }, // orange-400
    'function': { color: '#fdba74' }, // orange-300
    'keyword': { color: '#ffedd5' }, // orange-100
    'operator': { color: '#fed7aa' }, // orange-200
    'class-name': { color: '#fed7aa' }, // orange-200
    'comment': { color: '#737373' }, // neutral-500
    'punctuation': { color: '#a3a3a3' }, // neutral-400
};

export default function CodeBlock({
    code,
    language = "javascript",
    filename,
    showLineNumbers = false
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-md overflow-hidden shadow-2xl relative group font-sans hover:border-orange-500/30 transition-all duration-300">
            {/* Window Chrome / Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                    </div>
                    {filename && (
                        <div className="text-xs text-neutral-400 font-mono ml-2 opacity-80">
                            {filename}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleCopy}
                    className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Copy code"
                >
                    {copied ? <Check size={14} className="text-orange-400" /> : <Copy size={14} />}
                </button>
            </div>

            {/* Code Content */}
            <div className="relative overflow-x-auto text-[13px] leading-relaxed p-0">
                <SyntaxHighlighter
                    language={language}
                    style={orangeTheme}
                    showLineNumbers={showLineNumbers}
                    customStyle={{
                        margin: 0,
                        padding: "1.5rem",
                        background: "transparent",
                        fontSize: "0.875rem",
                    }}
                    lineNumberStyle={{
                        minWidth: "2rem",
                        paddingRight: "1rem",
                        color: "#525252",
                        textAlign: "right",
                    }}
                    wrapLines={true}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}
