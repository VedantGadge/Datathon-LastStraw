"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Cpu, ShieldCheck, Activity, ChevronRight } from "lucide-react";

export default function ArchitectureDiagram() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
            {/* Professional Horizontal Flow */}
            <motion.div
                className="hidden md:flex items-center justify-center gap-0"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
            >
                {/* Node 1: User Query */}
                <motion.div variants={item}>
                    <DiagramNode
                        step="01"
                        title="User Query"
                        subtitle="Web / Mobile"
                        icon="user"
                    />
                </motion.div>

                <motion.div variants={item}>
                    <Connector delay={0.5} />
                </motion.div>

                {/* Node 2: Generative AI */}
                <motion.div variants={item}>
                    <DiagramNode
                        step="02"
                        title="Generative AI"
                        subtitle="RAG / LLM"
                        icon="cpu"
                    />
                </motion.div>

                <motion.div variants={item}>
                    <Connector delay={1.5} />
                </motion.div>

                {/* Node 3: Endurance Engine (Focal Point) */}
                <motion.div variants={item} className="relative z-10 shrink-0">
                    <div className="absolute -inset-4 bg-orange-500/10 blur-xl rounded-full"></div>
                    <div className="relative flex flex-col items-center justify-center w-48 h-32 border-2 border-orange-200 dark:border-orange-500/30 bg-white dark:bg-zinc-950 rounded-xl shadow-lg">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 bg-orange-100 dark:bg-orange-500/20 rounded-full border border-orange-200 dark:border-orange-500/30">
                            <span className="text-[9px] font-mono font-bold text-orange-700 dark:text-orange-300 tracking-widest uppercase flex items-center gap-1">
                                <ShieldCheck size={10} /> Guardrails
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight mt-2">Endurance</h3>
                        <p className="text-[10px] text-neutral-500 mt-0.5 mb-2">RAI Metrics Engine</p>
                        <div className="flex gap-1.5">
                            <StatusDot color="bg-emerald-500" delay={0} />
                            <StatusDot color="bg-orange-500" delay={0.2} />
                            <StatusDot color="bg-blue-500" delay={0.4} />
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={item}>
                    <Connector delay={2.5} />
                </motion.div>

                {/* Node 4: Verified Output */}
                <motion.div variants={item}>
                    <DiagramNode
                        step="04"
                        title="Verified Output"
                        subtitle="Safe & Compliant"
                        icon="check"
                    />
                </motion.div>
            </motion.div>

            {/* Mobile: Vertical Stack */}
            <motion.div
                className="md:hidden flex flex-col items-center gap-3"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
            >
                <motion.div variants={item}><MobileNode step="01" title="User Query" subtitle="Web / Mobile" icon="user" /></motion.div>
                <motion.div variants={item}><MobileConnector /></motion.div>
                <motion.div variants={item}><MobileNode step="02" title="Generative AI" subtitle="RAG / LLM" icon="cpu" /></motion.div>
                <motion.div variants={item}><MobileConnector /></motion.div>
                <motion.div variants={item} className="relative w-full max-w-xs">
                    <div className="absolute -inset-2 bg-orange-500/10 blur-xl rounded-full"></div>
                    <div className="relative flex flex-col items-center justify-center p-4 border-2 border-orange-200 dark:border-orange-500/30 bg-white dark:bg-zinc-950 rounded-xl shadow-lg">
                        <span className="text-[9px] font-mono font-bold text-orange-600 dark:text-orange-400 tracking-widest uppercase mb-1">Guardrails</span>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Endurance</h3>
                        <p className="text-[10px] text-neutral-500">RAI Metrics Engine</p>
                    </div>
                </motion.div>
                <motion.div variants={item}><MobileConnector /></motion.div>
                <motion.div variants={item}><MobileNode step="04" title="Verified Output" subtitle="Safe & Compliant" icon="check" /></motion.div>
            </motion.div>
        </div>
    );
}
function DiagramNode({ step, title, subtitle, icon }) {
    const Icon = icon === 'user' ? User : icon === 'cpu' ? Cpu : icon === 'check' ? ShieldCheck : Activity;

    return (
        <div className="relative group shrink-0 w-32">
            <div className="flex flex-col items-center text-center border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-3 rounded-lg hover:border-orange-500/20 hover:shadow-sm transition-all duration-300 h-28 justify-center">
                <div className="absolute top-2 left-2">
                    <span className="text-[8px] font-mono text-neutral-300 dark:text-zinc-700 bg-neutral-50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded">{step}</span>
                </div>
                <Icon size={20} className="text-neutral-400 group-hover:text-orange-500 transition-colors mb-2" strokeWidth={1.5} />
                <div className="font-medium text-neutral-800 dark:text-neutral-200 text-xs">{title}</div>
                <div className="text-[9px] text-neutral-400">{subtitle}</div>
            </div>
        </div>
    );
}

/* Professional Horizontal Connector - a line with an arrow */
function Connector({ delay = 0 }) {
    return (
        <div className="flex items-center shrink-0 px-2 opacity-100">
            <div className="w-12 h-0.5 bg-neutral-200 dark:bg-zinc-800 relative rounded-full overflow-hidden">
                <motion.div
                    className="absolute top-0 left-0 h-full bg-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: delay,
                        repeatDelay: 2
                    }}
                />
            </div>
            <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                    duration: 0.2,
                    delay: delay + 0.8, // Show arrow head slightly before line finishes
                    repeat: Infinity,
                    repeatDelay: 2.8 // (duration 1 + repeatDelay 2) - duration 0.2
                }}
            >
                <ChevronRight size={14} className="text-orange-500 -ml-1" strokeWidth={2.5} />
            </motion.div>
        </div>
    );
}

/* Mobile Node */
function MobileNode({ step, title, subtitle, icon }) {
    const Icon = icon === 'user' ? User : icon === 'cpu' ? Cpu : icon === 'check' ? ShieldCheck : Activity;
    return (
        <div className="w-full max-w-xs border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 rounded-xl flex items-center gap-4">
            <Icon size={28} className="text-neutral-500 shrink-0" />
            <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{title}</div>
                <div className="text-[10px] text-neutral-500">{subtitle}</div>
            </div>
            <span className="ml-auto text-[9px] font-mono text-neutral-400 bg-neutral-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{step}</span>
        </div>
    );
}

/* Mobile Vertical Connector */
function MobileConnector() {
    return (
        <div className="flex flex-col items-center justify-center h-6 text-neutral-300 dark:text-zinc-700">
            <div className="w-0.5 h-3 bg-current"></div>
            <ChevronRight size={14} className="rotate-90" />
        </div>
    );
}

function StatusDot({ color, delay = 0 }) {
    return (
        <motion.div
            className={`w-2 h-2 rounded-full ${color}`}
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay }}
        />
    );
}
