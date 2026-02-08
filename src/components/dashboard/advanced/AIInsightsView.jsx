"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Sparkles, AlertTriangle, ArrowRight, BrainCircuit, TrendingUp } from "lucide-react";

export default function AIInsightsView() {
    const [weekly, setWeekly] = useState(null);
    const [strategy, setStrategy] = useState(null);
    const [risks, setRisks] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetchAll() {
            try {
                const [weeklyRes, strategyRes, risksRes] = await Promise.all([
                    fetch("/api/reports/weekly", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ team_id: 0, days_back: 7 }),
                    }),
                    fetch("/api/reports/strategy"),
                    fetch("/api/reports/risks"),
                ]);

                const [weeklyData, strategyData, risksData] = await Promise.all([
                    weeklyRes.ok ? weeklyRes.json() : null,
                    strategyRes.ok ? strategyRes.json() : null,
                    risksRes.ok ? risksRes.json() : null,
                ]);

                if (cancelled) return;
                setWeekly(weeklyData);
                setStrategy(strategyData);
                setRisks(risksData);
            } catch (e) {
                // Keep UI stable with fallbacks below
                console.error("Failed to fetch AI insights reports:", e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchAll();
        return () => {
            cancelled = true;
        };
    }, []);

    const recommendations = useMemo(
        () => (Array.isArray(strategy?.recommendations) ? strategy.recommendations : []),
        [strategy]
    );
    const projects = useMemo(
        () => (Array.isArray(risks?.projects) ? risks.projects : []),
        [risks]
    );

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
                        {loading ? "Loading..." : (weekly?.overview || "No overview available.")}
                    </p>
                    <p>
                        <span className="font-semibold text-neutral-900 dark:text-white">Risk Assessment:</span>
                        {loading ? "Loading..." : (weekly?.risk_assessment || "No risk assessment available.")}
                    </p>
                    <p>
                        <span className="font-semibold text-neutral-900 dark:text-white">People Pulse:</span>
                        {loading ? "Loading..." : (weekly?.people_pulse || "No people pulse available.")}
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
                        {loading && (
                            <div className="text-sm text-neutral-500">Loading recommendations...</div>
                        )}

                        {!loading && recommendations.length === 0 && (
                            <div className="text-sm text-neutral-500">No recommendations available.</div>
                        )}

                        {recommendations.map((rec) => {
                            const type = (rec?.type || "").toLowerCase();
                            const isCulture = type === "culture";
                            const title = rec?.title || "Recommendation";
                            const impact = rec?.impact || rec?.type || "";
                            const description = rec?.description || "";
                            const ctaText = isCulture ? "View Proposal" : "Apply";

                            return (
                                <div
                                    key={`${title}-${impact}`}
                                    className={
                                        isCulture
                                            ? "p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg group hover:border-orange-200 transition-all cursor-pointer"
                                            : "p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg group hover:border-blue-200 transition-all cursor-pointer"
                                    }
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={isCulture ? "font-medium text-orange-900 dark:text-orange-100" : "font-medium text-blue-900 dark:text-blue-100"}>
                                            {title}
                                        </h4>
                                        {impact && (
                                            <span className={
                                                isCulture
                                                    ? "text-xs bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full"
                                                    : "text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full"
                                            }>
                                                {impact}
                                            </span>
                                        )}
                                    </div>
                                    {description && (
                                        <p className={isCulture ? "text-xs text-orange-700 dark:text-orange-300 mb-3" : "text-xs text-blue-700 dark:text-blue-300 mb-3"}>
                                            {description}
                                        </p>
                                    )}
                                    <div className={isCulture ? "flex items-center text-xs font-medium text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform" : "flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform"}>
                                        {ctaText} <ArrowRight className="w-3 h-3 ml-1" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Algorithmic Risk Scoring */}
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Project Risk Scoring
                    </h3>
                    <div className="space-y-4">
                        {loading && (
                            <div className="text-sm text-neutral-500">Loading risks...</div>
                        )}

                        {!loading && projects.length === 0 && (
                            <div className="text-sm text-neutral-500">No risk scores available.</div>
                        )}

                        {projects.map((project) => {
                            const score = typeof project?.risk_score === "number" ? project.risk_score : 0;
                            const name = project?.project_name || project?.project_id || "Project";
                            const driver = project?.primary_driver || "";
                            return (
                                <div key={project?.project_id || name} className="flex items-center justify-between p-3 border-b border-neutral-100 dark:border-zinc-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
                                    <div>
                                        <div className="font-medium text-sm text-neutral-900 dark:text-white">{name}</div>
                                        <div className="text-xs text-neutral-500">Driver: {driver}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-lg font-bold ${score > 70 ? "text-red-500" :
                                            score > 40 ? "text-orange-500" : "text-green-500"
                                            }`}>
                                            {score}/100
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-neutral-400">Risk Score</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
