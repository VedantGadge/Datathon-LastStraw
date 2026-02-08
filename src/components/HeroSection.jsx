"use client";


import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AuroraBackground } from "./ui/aurora-background";
import MainCta from "./MainCta";
import { LeftCard, RightTopCard, RightBottomCard, FloatingIcons } from "./HeroCards";

const logos = [
    "https://framerusercontent.com/images/Az7kS7OR5kGkxi4GdRtCDqY12A.svg?width=121&height=35",
    "https://framerusercontent.com/images/lF7zXOmAy1vXpEH6ZsJjO1sVs.svg?width=134&height=35",
    "https://framerusercontent.com/images/tdMiHJ5UALgFmuzwKuwJyMsfk.svg?width=113&height=35",
    "https://framerusercontent.com/images/8FNXOeD0gUDQyQQ0vLDgcCJJR4.svg?width=126&height=35",
    "https://framerusercontent.com/images/PnESJDZL4XXXvHXsAMPJ38oFCE.svg?width=124&height=35",
];

const features = [
    {
        label: "Workflow Automation",
        icon: "https://framerusercontent.com/images/y8BBNbAsFSb2eCv8Of7CxxTLGOc.svg",
    },
    {
        label: "Team Monitoring",
        icon: "https://framerusercontent.com/images/y8BBNbAsFSb2eCv8Of7CxxTLGOc.svg",
    },
    {
        label: "Code Reviews",
        icon: "https://framerusercontent.com/images/y8BBNbAsFSb2eCv8Of7CxxTLGOc.svg",
    }
];

export default function HeroSection() {
    return (
        <AuroraBackground className="pt-32 pb-20 overflow-hidden">
            <div className="container mx-auto px-4 flex flex-col items-center text-center max-w-4xl relative z-10">

                {/* Top Badge */}
                {/* <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-1.5 py-1.5 mb-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-neutral-200 dark:border-zinc-800 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                    <span className="px-2.5 py-0.5 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-zinc-800 rounded-full">
                        New
                    </span>
                    <span className="flex items-center gap-1 pr-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-500 fill-current">
                            <path d="M12 2L14.35 9.65L22 12L14.35 14.35L12 22L9.65 14.35L2 12L9.65 9.65L12 2Z" />
                        </svg>
                        Smart AI Features
                    </span>
                </motion.div> */}
                {/* Main Heading */}
                <motion.h1
                    className="text-5xl md:text-7xl font-sans font-medium tracking-tight text-black dark:text-white leading-tight mb-6"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.2, // Stagger effect starts after 0.2s
                            },
                        },
                    }}
                >
                    {[
                        "Agentic AI for",
                        "Seamless Workflow",
                        "Automation",
                    ].map((line, lineIndex) => (
                        <React.Fragment key={lineIndex}>
                            <span className="inline-block">
                                {line.split(" ").map((word, wordIndex) => (
                                    <motion.span
                                        key={wordIndex}
                                        className="inline-block mr-2 md:mr-4 last:mr-0"
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: {
                                                opacity: 1,
                                                y: 0,
                                                transition: {
                                                    type: "spring",
                                                    damping: 12,
                                                    stiffness: 100,
                                                },
                                            },
                                        }}
                                    >
                                        {word}
                                    </motion.span>
                                ))}
                            </span>
                            {/* Force line break for md screens and up, or always if that was the design */}
                            {lineIndex < 2 && <br className="hidden md:block" />}
                        </React.Fragment>
                    ))}
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mb-10"
                >
                    Automate Notion, GitHub, and Jira. Monitor team performance and get real-time insights with our intelligent agent.
                </motion.p>

                {/* Features Row */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-wrap justify-center gap-4 mb-12"
                >
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 px-4 py-2 bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 rounded-full shadow-sm"
                        >
                            <img src={feature.icon} alt="" className="w-4 h-4 opacity-60 dark:opacity-80 dark:invert transition-opacity" />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{feature.label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Action Buttons */}
                {/* <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center gap-4 mb-20"
                >
                    <MainCta variant="primary" href="#">
                        Get Active
                    </MainCta>
                    <MainCta variant="secondary" href="#">
                        Request a Demo
                    </MainCta>
                </motion.div> */}

            </div>

            {/* Custom Keyframe for Loop Scroll embedded for simplicity since we can't edit global CSS easily right now */}
            <style jsx global>{`
        @keyframes loop-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-loop-scroll {
          animation: loop-scroll 40s linear infinite;
        }
      `}</style>
        </AuroraBackground>
    );
}
