import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProgressBar({ progress, label, color = "bg-orange-500", height = "h-4", showPercentage = true, milestones = [] }) {
    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                {label && <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>}
                {showPercentage && <span className="text-sm font-bold text-neutral-900 dark:text-white">{progress}%</span>}
            </div>
            <div className={cn("w-full bg-neutral-100 dark:bg-zinc-800 rounded-full overflow-hidden relative", height)}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn("h-full rounded-full relative", color)}
                >
                    {/* Animated shine effect */}
                    <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-shimmer" />
                </motion.div>

                {/* Milestones markers if any */}
                {milestones.map((m, idx) => (
                    <div
                        key={idx}
                        className="absolute top-0 bottom-0 w-0.5 bg-white/50 dark:bg-black/20 z-10"
                        style={{ left: `${m.percentage}%` }}
                        title={m.label}
                    />
                ))}
            </div>
            {milestones.length > 0 && (
                <div className="relative h-6 mt-1 text-xs text-neutral-400">
                    {milestones.map((m, idx) => (
                        <div
                            key={idx}
                            className="absolute transform -translate-x-1/2 text-center w-20"
                            style={{ left: `${m.percentage}%` }}
                        >
                            {m.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
