"use client";

import React, { useState, useEffect } from "react";
import { MetricCard } from "./shared/MetricCard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Activity, GitMerge, ShieldAlert, Zap, Terminal } from "lucide-react";
import { InsightPanel } from "./shared/InsightPanel";

export default function DeveloperDashboard() {
    const [loading, setLoading] = useState(true);
    const [doraData, setDoraData] = useState(null);
    const [codeQuality, setCodeQuality] = useState(null);
    const [recommendations, setRecommendations] = useState(null);

    useEffect(() => {
        async function fetchAll() {
            // Check cache first
            const cachedDora = sessionStorage.getItem('dev_dora');
            const cachedQuality = sessionStorage.getItem('dev_quality');
            const cachedRecs = sessionStorage.getItem('dev_recs');
            const cachedPipes = sessionStorage.getItem('dev_pipelines');

            if (cachedDora && cachedQuality && cachedRecs && cachedPipes) {
                const doraData = JSON.parse(cachedDora);
                const pipesData = JSON.parse(cachedPipes);

                setDoraData({
                    ...doraData,
                    pipelines: pipesData.pipelines,
                    pipelineSummary: pipesData.summary
                });
                setCodeQuality(JSON.parse(cachedQuality));
                setRecommendations(JSON.parse(cachedRecs));
                setLoading(false);
                return;
            }

            try {
                const [doraRes, qualityRes, recsRes, pipesRes] = await Promise.all([
                    fetch('/api/dora'),
                    fetch('/api/code-quality'),
                    fetch('/api/ai-recommendations'),
                    fetch('/api/pipelines')
                ]);

                const doraData = await doraRes.json();
                const pipesData = await pipesRes.json();
                const qualityData = await qualityRes.json();
                const recsData = await recsRes.json();

                // Save to cache
                sessionStorage.setItem('dev_dora', JSON.stringify(doraData));
                sessionStorage.setItem('dev_pipelines', JSON.stringify(pipesData));
                sessionStorage.setItem('dev_quality', JSON.stringify(qualityData));
                sessionStorage.setItem('dev_recs', JSON.stringify(recsData));

                // Merge pipeline data into DORA data but preserve DORA summary
                setDoraData({
                    ...doraData,
                    pipelines: pipesData.pipelines,
                    pipelineSummary: pipesData.summary
                });
                setCodeQuality(qualityData);
                setRecommendations(recsData);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);

    const summary = doraData?.summary || {
        deploymentFrequency: 4.2,
        leadTime: 2.1,
        changeFailureRate: 8.5,
        mttr: 45
    };

    // Transform daily trend for chart
    // Transform pipeline data for chart (grouped by day)
    const pipelineHistory = {};
    if (doraData?.pipelines) {
        doraData.pipelines.forEach(p => {
            const date = new Date(p.last_run).toLocaleDateString('en-US', { weekday: 'short' });
            if (!pipelineHistory[date]) pipelineHistory[date] = { success: 0, fail: 0 };
            if (p.status === 'success') pipelineHistory[date].success++;
            else pipelineHistory[date].fail++;
        });
    }

    const deploymentData = Object.keys(pipelineHistory).length > 0
        ? Object.entries(pipelineHistory).map(([name, stats]) => ({ name, success: stats.success, fail: stats.fail }))
        : [
            { name: "Mon", success: 12, fail: 1 },
            { name: "Tue", success: 15, fail: 0 },
            { name: "Wed", success: 8, fail: 2 },
            { name: "Thu", success: 18, fail: 1 },
            { name: "Fri", success: 14, fail: 0 },
            { name: "Sat", success: 5, fail: 0 },
            { name: "Sun", success: 2, fail: 0 },
        ];

    const codeQualityData = codeQuality?.breakdown || [
        { name: "Duplication", value: 3.2 },
        { name: "Complexity", value: 12.5 },
        { name: "Coverage", value: 88 },
        { name: "Bugs", value: 1.5 },
    ];

    const recs = recommendations?.recommendations || [];

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        Developer Productivity <span className="text-orange-500">Hub</span>
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Real-time insights across CI/CD, Code Quality, and Engineering Velocity.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Live Systems Connected
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium border border-blue-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        v2.4.0
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                {/* LEFT MAIN CONTENT */}
                <div className="xl:col-span-8 space-y-6">

                    {/* 1. DORA Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Deployment Frequency"
                            value={loading ? "..." : `${summary.deploymentFrequency}/day`}
                            trend={summary.deploymentFrequency > 3 ? "up" : "down"}
                            trendValue={doraData?.hasData ? "Live" : "Demo"}
                            icon={RocketIcon}
                        />
                        <MetricCard
                            title="Lead Time"
                            value={loading ? "..." : `${summary.leadTime}h`}
                            trend={summary.leadTime < 4 ? "down" : "up"}
                            trendValue={summary.leadTime < 4 ? "Fast" : "Slow"}
                            icon={Zap}
                        />
                        <MetricCard
                            title="Change Failure Rate"
                            value={loading ? "..." : `${summary.changeFailureRate}%`}
                            trend={summary.changeFailureRate < 10 ? "neutral" : "active"}
                            trendValue={summary.changeFailureRate < 10 ? "Good" : "Alert"}
                            icon={ShieldAlert}
                            className={summary.changeFailureRate > 15 ? "border-red-500/30 bg-red-500/5" : ""}
                        />
                        <MetricCard
                            title="MTTR"
                            value={loading ? "..." : `${summary.mttr}m`}
                            trend={summary.mttr < 60 ? "down" : "up"}
                            trendValue={summary.mttr < 60 ? "Excellent" : "Review"}
                            icon={Activity}
                        />
                    </div>

                    {/* 2. Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* CI/CD Pipeline Monitor (Wider) */}
                        <div className="lg:col-span-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-neutral-200/60 dark:border-zinc-800/60 rounded-xl p-6 shadow-sm flex flex-col h-[350px]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Terminal className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">CI/CD Pipeline Activity</h3>
                                    <p className="text-xs text-neutral-500">Deployments & Builds</p>
                                </div>
                                <span className="text-[10px] text-neutral-400 ml-auto border border-neutral-200 dark:border-zinc-800 px-2 py-1 rounded bg-neutral-50 dark:bg-zinc-900">
                                    {doraData?.pipelineSummary ? "PostgreSQL" : "Demo"}
                                </span>
                            </div>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={deploymentData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(24, 24, 27, 0.95)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "6px",
                                                color: "#fff",
                                                fontSize: "12px",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                                            }}
                                        />
                                        <Area type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" />
                                        <Area type="monotone" dataKey="fail" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFail)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* 3. Code Quality & AI Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Code Quality */}
                        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-neutral-200/60 dark:border-zinc-800/60 rounded-xl p-6 shadow-sm flex flex-col h-[350px]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Activity className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Code Quality</h3>
                                    <p className="text-xs text-neutral-500">Live Static Analysis</p>
                                </div>
                            </div>
                            <div className="flex-1 w-full min-h-0 flex flex-col justify-center gap-6 px-2">
                                {codeQualityData.map((item, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-600 dark:text-neutral-400 font-medium">{item.name}</span>
                                            <span className="text-neutral-900 dark:text-white font-bold">{item.value}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-neutral-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${item.name === "Coverage" ? "bg-blue-500" :
                                                    item.name === "Bugs" ? "bg-red-500" :
                                                        item.name === "Complexity" ? "bg-amber-500" : "bg-purple-500"
                                                    }`}
                                                style={{ width: `${item.value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Recommendations */}
                        <div className="bg-gradient-to-br from-white to-orange-50/30 dark:from-zinc-900 dark:to-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm relative overflow-hidden h-[350px] overflow-y-auto custom-scrollbar">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                            <div className="relative flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">AI Advice</h3>
                                        <p className="text-xs text-neutral-500">Actionable Insights</p>
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
                            </div>

                            <div className="space-y-3">
                                {recs.length > 0 ? recs.slice(0, 4).map((rec, i) => (
                                    <FixRecommendation
                                        key={i}
                                        title={rec.title}
                                        severity={rec.severity}
                                        description={rec.description}
                                        action={rec.action}
                                    />
                                )) : (
                                    <>
                                        <FixRecommendation
                                            title="Unused Dependencies"
                                            severity="low"
                                            description="Found 3 unused packages"
                                            action="Run npm prune"
                                        />
                                        <FixRecommendation
                                            title="Memory Leak"
                                            severity="high"
                                            description="Listeners not removed"
                                            action="Add cleanup"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR - INSIGHT PANEL */}
                <div className="xl:col-span-4 xl:sticky xl:top-28 h-[600px] xl:h-[calc(100vh-8rem)] min-h-[500px]">
                    <InsightPanel context={{ summary, codeQuality: codeQuality?.metrics }} />
                </div>

            </div>
        </div>
    );
}

function RocketIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
    );
}

function FixRecommendation({ title, severity, description, action }) {
    const severityConfig = {
        high: { color: "bg-red-500", label: "Critical" },
        medium: { color: "bg-orange-500", label: "Warning" },
        low: { color: "bg-blue-500", label: "Notice" }
    };

    const config = severityConfig[severity] || severityConfig.low;

    return (
        <div className="group p-4 bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-neutral-900 dark:text-white text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {title}
                </h4>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800">
                    <div className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
                    <span className="text-[10px] font-medium uppercase text-neutral-600 dark:text-neutral-400">
                        {config.label}
                    </span>
                </div>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                {description}
            </p>

            <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors">
                View Fix <span className="text-[10px]">→</span>
            </button>
        </div>
    );
}
