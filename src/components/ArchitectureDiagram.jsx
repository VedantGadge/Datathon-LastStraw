"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Cpu, ShieldCheck, Activity } from "lucide-react";

export default function ArchitectureDiagram() {
    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            {/* Container */}
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">

                {/* Node 1: User Query */}
                <DiagramNode
                    step="01"
                    title="User Query"
                    subtitle="Web / Mobile"
                    type="input"
                    icon="user"
                />

                <Connector />

                {/* Node 2: AI Model */}
                <DiagramNode
                    step="02"
                    title="Generative AI"
                    subtitle="RAG / LLM"
                    type="process"
                    icon="cpu"
                />

                <Connector />

                {/* Node 3: Endurance Engine (Focal Point) */}
                <div className="relative z-10 shrink-0">
                    <div className="absolute -inset-4 bg-orange-500/10 blur-xl rounded-full"></div>
                    <div className="relative flex flex-col items-center justify-center w-56 h-36 border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl shadow-lg hover:shadow-orange-500/10 transition-shadow duration-500">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 bg-orange-100 dark:bg-orange-500/20 rounded-full border border-orange-200 dark:border-orange-500/30">
                            <span className="text-[10px] font-mono font-bold text-orange-700 dark:text-orange-300 tracking-widest uppercase">
                                Guardrails
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Endurance</h3>
                        <p className="text-[10px] text-neutral-500 mt-1 mb-3">Metrics Engine</p>

                        <div className="flex gap-1.5">
                            <StatusDot color="bg-green-500" delay={0} />
                            <StatusDot color="bg-orange-500" delay={0.2} />
                            <StatusDot color="bg-blue-500" delay={0.4} />
                        </div>

                        <div className="mt-4 w-full px-4 border-t border-dashed border-neutral-200 dark:border-zinc-800 pt-2 flex justify-between text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
                            <span>Scanning</span>
                            <span>Verifying</span>
                        </div>
                    </div>
                </div>

                <Connector />

                {/* Node 4: Verified Response */}
                <DiagramNode
                    step="04"
                    title="Verified Output"
                    subtitle="Safe & Compliant"
                    type="output"
                    icon="check"
                />
            </div>

            {/* Legend / Footer */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-neutral-100 dark:border-zinc-900 pt-8">
                <LegendItem label="User Flow" type="line" />
                <LegendItem label="AI Processing" type="dot" color="bg-neutral-400" />
                <LegendItem label="Safety Check" type="dot" color="bg-orange-500" />
            </div>
        </div>
    );
}


function DiagramNode({ step, title, subtitle, type, icon }) {
    const Icon = icon === 'user' ? User : icon === 'cpu' ? Cpu : icon === 'check' ? ShieldCheck : Activity;

    return (
        <div className="relative group w-40 flex-shrink-0">
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-neutral-100 dark:bg-zinc-900 rounded-r-sm group-hover:bg-orange-500/50 transition-colors"></div>
            <div className="border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900/30 p-4 rounded-xl hover:border-orange-500/20 transition-colors">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-neutral-400">{step}</span>
                    {icon && <Icon size={14} className="text-neutral-400 group-hover:text-orange-500 transition-colors" />}
                </div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-200 text-sm">{title}</div>
                <div className="text-[10px] text-neutral-500 mt-1">{subtitle}</div>
            </div>
        </div>
    )
}

function Connector() {
    return (
        <div className="hidden md:flex flex-1 items-center px-2">
            <div className="h-px bg-neutral-200 dark:bg-zinc-800 w-full relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent w-1/2 mx-auto opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-neutral-400 dark:bg-zinc-600 rounded-full"></div>
            </div>
        </div>
    )
}

function StatusDot({ color, delay = 0 }) {
    return (
        <motion.div
            className={`w-1.5 h-1.5 rounded-full ${color}`}
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay }}
        />
    )
}

function LegendItem({ label, type, color }) {
    return (
        <div className="flex items-center gap-2">
            {type === 'line' && <div className="w-4 h-0.5 bg-neutral-300 dark:bg-zinc-700"></div>}
            {type === 'dot' && <div className={`w-2 h-2 rounded-full ${color}`}></div>}
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</span>
        </div>
    )
}


