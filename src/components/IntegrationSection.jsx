"use client";

import React from "react";
import { Check, ArrowRight, Terminal } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import CodeBlock from "./ui/CodeBlock";
import MainCta from "./MainCta";

export default function IntegrationSection() {
    return (
        <section id="integration" className="py-24 bg-zinc-950 text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Left: Content */}
                    <div className="lg:w-1/2 space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-6">
                                <Terminal size={12} />
                                <span>Developer First</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                                Connect with your <br />
                                <span className="text-neutral-500">favorite tools.</span>
                            </h2>
                            <p className="text-lg text-neutral-400 leading-relaxed max-w-xl">
                                Our agent seamlessly integrates with your existing workflow. Connect Notion, Jira, and GitHub in just a few clicks.
                            </p>
                        </div>

                        <ul className="space-y-4">
                            {[
                                "Notion for Documentation",
                                "Jira for Issue Tracking",
                                "GitHub for Code Management",
                                "Real-time Alerts & Logs"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-neutral-300">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check size={14} className="text-green-400" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="pt-4">
                            <MainCta
                                href="/signup"
                                variant="primary"
                                className="inline-flex items-center gap-2"
                                buttonClassName="bg-white text-black dark:text-black border-transparent ring-1 ring-inset ring-white hover:ring-black transition-colors duration-300 [&_div.bg-primary]:bg-black [&_.text-primary-foreground]:text-white"
                                showArrow={false}
                            >
                                Start Integration <ArrowRight size={16} />
                            </MainCta>
                        </div>
                    </div>

                    {/* Right: Code Preview */}
                    <div className="lg:w-1/2 w-full">
                        <CodeBlock
                            language="yaml"
                            filename="agent-config.yaml"
                            code={`integrations:
  notion:
    database_id: "ntn_db_..."
    enable_sync: true
    
  jira:
    project_key: "PROJ"
    auto_create_tickets: true
    
  github:
    repository: "org/repo"
    branch_protection: true

monitoring:
  alerts:
    - type: "deployment_failed"
    - type: "high_latency"
    
agent:
  mode: "autonomous"
  approval_required: true`}
                        />

                        {/* Floating Badge - Positioned relative to the CodeBlock wrapper if needed, or adjust z-index */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute bottom-6 right-6 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-lg backdrop-blur-md flex items-center gap-2 text-sm font-medium z-10"
                        >
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            Active Monitoring
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
