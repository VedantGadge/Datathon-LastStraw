"use client";

import React from "react";
import { Sparkles, AlertTriangle, ArrowRight, BrainCircuit, TrendingUp } from "lucide-react";

export default function AIInsightsView() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <BrainCircuit className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Endurance AI Intelligence</h2>
                    <p className="text-sm text-neutral-500">Analysis generated from Jira, GitHub, and Slack data.</p>
                </div>
            </div>

            {/* AI Executive Summary */}
            <div className="bg-gradient-to-br from-purple-50 to-white dark:from-zinc-900 dark:to-zinc-900 border border-purple-100 dark:border-zinc-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles className="w-40 h-40 text-purple-600" />
                </div>

                <h3 className="text-lg font-semibold mb-4 text-purple-900 dark:text-purple-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Executive Weekly Summary
                </h3>

                <div className="space-y-4 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-4xl relative z-10">
                    <p>
                        <span className="font-semibold text-neutral-900 dark:text-white">Overview:</span>
                        Engineering velocity has increased by <span className="text-green-600 font-medium">12%</span> this week, driven primarily by the Frontend team closing out the "Auth Refactor" epic. However, overall reliability has dipped slightly due to 2 outages in the Payment Service on Tuesday.
                    </p>
                    <p>
                        <span className="font-semibold text-neutral-900 dark:text-white">Risk Assessment:</span>
                        The "GenAI Integration" feature is currently <span className="text-red-500 font-medium">at risk</span> of missing the Q3 deadline.
                        The Primary bottleneck is <span className="font-medium underline decoration-red-300">Developer Capacity</span> in the Backend team.
                    </p>
                    <p>
                        <span className="font-semibold text-neutral-900 dark:text-white">People Pulse:</span>
                        Sentiment analysis indicates high morale in the Mobile team but signs of burnout in DevOps (avg workday &gt; 10h).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Intelligent Recommendations */}
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Strategic Recommendations
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg group hover:border-blue-200 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-blue-900 dark:text-blue-100">Reallocate 2 Backend Engineers</h4>
                                <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">High Impact</span>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                                Moving 2 senior devs from "Maintenance" to "GenAI Integration" will increase delivery probability from 45% to <span className="font-bold">85%</span>.
                            </p>
                            <div className="flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                                Apply Reallocation <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                        </div>

                        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg group hover:border-orange-200 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-orange-900 dark:text-orange-100">Schedule "No-Meeting Wednesday"</h4>
                                <span className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full">Culture</span>
                            </div>
                            <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
                                DevOps team focus time is critically low (2h/day). Implementing a blocked day could improve MTTR by 15%.
                            </p>
                            <div className="flex items-center text-xs font-medium text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform">
                                View Proposal <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Algorithmic Risk Scoring */}
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Project Risk Scoring
                    </h3>
                    <div className="space-y-4">
                        {[
                            { name: "GenAI Integration", score: 85, trend: "high", reason: "Dependencies + Staffing" },
                            { name: "Mobile App V2", score: 42, trend: "medium", reason: "QA Bottleneck" },
                            { name: "Cloud Migration", score: 12, trend: "low", reason: "On Track" },
                        ].map((project) => (
                            <div key={project.name} className="flex items-center justify-between p-3 border-b border-neutral-100 dark:border-zinc-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
                                <div>
                                    <div className="font-medium text-sm text-neutral-900 dark:text-white">{project.name}</div>
                                    <div className="text-xs text-neutral-500">Driver: {project.reason}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-lg font-bold ${project.score > 70 ? "text-red-500" :
                                        project.score > 40 ? "text-orange-500" : "text-green-500"
                                        }`}>
                                        {project.score}/100
                                    </div>
                                    <div className="text-[10px] uppercase font-bold text-neutral-400">Risk Score</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
