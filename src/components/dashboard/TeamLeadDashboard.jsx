"use client";

import React, { useState, useEffect } from "react";
import { MetricCard } from "./shared/MetricCard";
import { ProgressBar } from "./shared/ProgressBar";
import { InsightPanel } from "./shared/InsightPanel";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Rocket, Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function TeamLeadDashboard() {
    const [loading, setLoading] = useState(true);
    const [sprintData, setSprintData] = useState(null);

    const [blockersData, setBlockersData] = useState(null);

    useEffect(() => {
        async function fetchData() {
            const cachedSprint = sessionStorage.getItem('lead_sprints');
            const cachedBlockers = sessionStorage.getItem('lead_blockers');

            if (cachedSprint && cachedBlockers) {
                setSprintData(JSON.parse(cachedSprint));
                setBlockersData(JSON.parse(cachedBlockers));
                setLoading(false);
                return;
            }

            try {
                const [sprintRes, blockersRes] = await Promise.all([
                    fetch('/api/sprints'),
                    fetch('/api/blockers')
                ]);

                const sprintData = await sprintRes.json();
                const blockersData = await blockersRes.json();

                sessionStorage.setItem('lead_sprints', JSON.stringify(sprintData));
                sessionStorage.setItem('lead_blockers', JSON.stringify(blockersData));

                setSprintData(sprintData);
                setBlockersData(blockersData);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const currentSprint = sprintData?.currentSprint || {
        name: "Sprint 24",
        committed: 55,
        completed: 38,
        progress: 69
    };

    const avgVelocity = sprintData?.avgVelocity || 52;

    const velocityData = sprintData?.velocityTrend?.map(s => ({
        name: s.name,
        committed: s.committed,
        completed: s.completed
    })) || [
            { name: "Sprint 1", committed: 50, completed: 45 },
            { name: "Sprint 2", committed: 55, completed: 52 },
            { name: "Sprint 3", committed: 52, completed: 48 },
            { name: "Sprint 4", committed: 60, completed: 55 },
            { name: "Sprint 5", committed: 58, completed: 56 },
        ];

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        Team Delivery <span className="text-orange-500">Center</span>
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Track sprints, velocity, and delivery roadblocks in real-time.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                {/* LEFT MAIN CONTENT */}
                <div className="xl:col-span-8 space-y-6">
                    {/* Feature Progress */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Rocket className="w-32 h-32 text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-neutral-900 dark:text-white">
                                {loading ? "Loading..." : `Current: ${currentSprint.name}`}
                            </h2>
                            <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-2xl">
                                {sprintData?.hasData ? "Live data from PostgreSQL" : "Demo data"}
                            </p>

                            <div className="mb-6">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">Sprint Progress</span>
                                    <span className="text-3xl font-bold text-orange-600">{currentSprint.progress}%</span>
                                </div>
                                <ProgressBar
                                    progress={currentSprint.progress}
                                    height="h-6"
                                    color="bg-gradient-to-r from-orange-500 to-amber-500"
                                    showPercentage={false}
                                    milestones={[
                                        { percentage: 25, label: "25%" },
                                        { percentage: 50, label: "50%" },
                                        { percentage: 75, label: "75%" },
                                        { percentage: 100, label: "Done" }
                                    ]}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="text-center p-4 bg-neutral-50 dark:bg-zinc-800 rounded-lg">
                                    <p className="text-2xl font-bold text-orange-600">{currentSprint.committed}</p>
                                    <p className="text-sm text-neutral-500">Points Committed</p>
                                </div>
                                <div className="text-center p-4 bg-neutral-50 dark:bg-zinc-800 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{currentSprint.completed}</p>
                                    <p className="text-sm text-neutral-500">Points Completed</p>
                                </div>
                                <div className="text-center p-4 bg-neutral-50 dark:bg-zinc-800 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{currentSprint.committed - currentSprint.completed}</p>
                                    <p className="text-sm text-neutral-500">Remaining</p>
                                </div>
                            </div>
                        </div>

                        {/* AI Sprint Prediction Widget */}
                        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-zinc-900 border border-indigo-100 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500 rounded-full opacity-10 blur-2xl"></div>

                            <div>
                                <h3 className="text-lg font-semibold mb-1 text-indigo-900 dark:text-indigo-100">Smart Forecast</h3>
                                <p className="text-xs text-indigo-600 dark:text-indigo-300 mb-6">Based on avg velocity ({avgVelocity} pts/sprint)</p>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-indigo-100 dark:border-white/5 pb-2">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Avg Velocity</span>
                                        <span className="font-medium text-neutral-900 dark:text-white">{avgVelocity} pts</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-indigo-100 dark:border-white/5 pb-2">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Completion Rate</span>
                                        <span className="font-bold text-green-600">
                                            {velocityData.length > 0 ? Math.round(velocityData.reduce((s, v) => s + (v.completed / v.committed), 0) / velocityData.length * 100) : 92}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Data Source</span>
                                        <span className={`px-2 py-1 ${sprintData?.hasData ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'} text-xs font-bold rounded-full`}>
                                            {sprintData?.hasData ? 'PostgreSQL' : 'Demo'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-3 bg-white/50 dark:bg-zinc-800/50 rounded-lg backdrop-blur-sm border border-indigo-50 dark:border-white/5">
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">AI Insight:</span> Based on historical data, your team maintains consistent velocity. Current sprint is on track.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Sprint Velocity"
                            value={loading ? "..." : `${avgVelocity} pts`}
                            trend="up"
                            trendValue={sprintData?.hasData ? "Live" : "Demo"}
                            icon={Rocket}
                        />
                        <MetricCard
                            title="Cycle Time"
                            value="2.4 days"
                            trend="down"
                            trendValue="-0.5 days"
                            icon={Clock}
                        />
                        <MetricCard
                            title="Active Blockers"
                            value={loading ? "..." : (blockersData?.summary?.total_blockers || 0)}
                            trend="active"
                            trendValue={blockersData?.hasData ? "Live from PostgreSQL" : "Demo Data"}
                            icon={AlertCircle}
                            className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10"
                        />
                        <MetricCard
                            title="Completion Rate"
                            value={`${currentSprint.progress}%`}
                            trend={currentSprint.progress > 60 ? "up" : "down"}
                            trendValue="Current Sprint"
                            icon={CheckCircle}
                        />
                    </div>

                    {/* Velocity Trend */}
                    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
                            Sprint Velocity Trend
                            <span className="text-xs text-neutral-400 ml-auto">
                                {sprintData?.hasData ? "Live from PostgreSQL" : "Demo Data"}
                            </span>
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={velocityData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#18181b", border: "none", borderRadius: "8px", color: "#fff" }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="committed" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Committed" />
                                    <Line type="monotone" dataKey="completed" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: "#f97316" }} activeDot={{ r: 6 }} name="Completed" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR - INSIGHT PANEL */}
                <div className="xl:col-span-4 xl:sticky xl:top-28 h-[600px] xl:h-[calc(100vh-8rem)] min-h-[500px]">
                    <InsightPanel context={{ sprint: currentSprint, blockers: blockersData }} />
                </div>
            </div>
        </div>
    );
}
