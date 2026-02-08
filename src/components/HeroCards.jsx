"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Zap, BarChart3, ArrowUp } from "lucide-react";

const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut",
            delay: 1.0
        }
    }
};

const floatVariants = {
    animate: {
        y: [0, -10, 0],
        transition: {
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

export const LeftCard = () => (
    <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 w-64 bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-xl border border-neutral-100 dark:border-zinc-800 hidden lg:block"
        style={{ rotate: "-6deg" }}
    >
        <div className="flex justify-between items-center mb-4">
            <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Revenue</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">$8,055.94</p>
            </div>
            <div className="flex items-center text-orange-500 text-xs font-bold gap-1">
                <TrendingUp size={14} /> +15.03%
            </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-neutral-400">Hours</span>
            <span className="text-xs text-neutral-400">Week</span>
            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">Month</span>
        </div>

        {/* Simple Chart Visualization */}
        <div className="h-24 flex items-end justify-between gap-1 mt-2">
            {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: 1.5 + (i * 0.1) }}
                    className="w-full bg-neutral-100 dark:bg-zinc-800 rounded-t-sm relative group"
                >
                    {/* Highlight last bar */}
                    {i === 3 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 shadow-lg px-2 py-1 rounded text-[10px] font-bold border border-neutral-100 dark:border-zinc-700 whitespace-nowrap z-10">
                            $41.379
                        </div>
                    )}
                    {/* Bar fill */}
                    <div className={`w-full absolute bottom-0 rounded-t-sm ${i === 3 ? "bg-orange-400 h-full" : "h-0 bg-neutral-200 dark:bg-zinc-700 group-hover:h-full transition-all"}`} />
                </motion.div>
            ))}
        </div>

    </motion.div>
);

export const RightTopCard = () => (
    <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="absolute right-0 md:-right-4 top-20 w-60 bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-xl border border-neutral-100 dark:border-zinc-800 hidden lg:block"
        style={{ rotate: "6deg" }}
    >
        <div className="absolute -top-3 -left-3 bg-white dark:bg-zinc-800 p-2 rounded-xl shadow-sm border border-neutral-100 dark:border-zinc-700">
            <div className="bg-orange-500 rounded-lg p-1.5">
                <TrendingUp className="text-white w-4 h-4" />
            </div>
        </div>

        <div className="ml-2">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Total active users</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">150K+</p>

            {/* Avatars */}
            <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-neutral-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold relative overflow-hidden`}>
                        <img src={`https://i.pravatar.cc/100?img=${10 + i}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-neutral-600 dark:text-neutral-400 font-bold relative z-10">
                    +15
                </div>
            </div>
        </div>
    </motion.div>
);

export const RightBottomCard = () => (
    <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="absolute right-8 bottom-12 w-64 bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-xl border border-neutral-100 dark:border-zinc-800 hidden lg:block"
        style={{ rotate: "-3deg" }}
    >
        <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex-1">
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Digital Product</p>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <ArrowUp size={10} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-bold text-neutral-900 dark:text-white">5,490</span>
                </div>
            </div>
            <div className="w-px h-8 bg-neutral-100 dark:bg-zinc-800" />
            <div className="flex-1">
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Physical Product</p>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <ArrowUp size={10} className="text-orange-600 dark:text-orange-400 rotate-180" />
                    </div>
                    <span className="font-bold text-neutral-900 dark:text-white">8,370</span>
                </div>
            </div>
        </div>
    </motion.div>
);

export const FloatingIcons = () => (
    <>
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="absolute left-20 bottom-20 hidden lg:block"
        >
            <motion.div
                variants={floatVariants}
                animate="animate"
                className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-full shadow-lg border border-neutral-100 dark:border-zinc-800 flex items-center justify-center"
            >
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                    <Zap className="text-orange-500 w-5 h-5 fill-current" />
                </div>
            </motion.div>
        </motion.div>
    </>
);
