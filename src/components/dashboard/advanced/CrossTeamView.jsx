"use client";

import React, { useState, useEffect } from "react";
import { MetricCard } from "../shared/MetricCard";
import { Network, Users, MessageSquare, Share2 } from "lucide-react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, Legend } from "recharts";

// Color palette for chart
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function CrossTeamView() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/collaboration');
                const result = await res.json();
                setData(result);
            } catch (err) {
                console.error("Failed to fetch collaboration data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Transform API data for scatter chart
    const chartData = data?.interactionMatrix?.map((item, idx) => ({
        x: 10 + (idx * 15) % 80,
        y: 20 + (idx * 12) % 60,
        z: item.volume * 10,
        name: `${item.source} <> ${item.target}`,
        fill: COLORS[idx % COLORS.length],
        strength: item.strength
    })) || [];

    const collaborationScore = data?.collaborationScore || 72;
    const siloAlerts = data?.siloAlerts || [];
    const highRiskCount = siloAlerts.filter(a => a.severity === 'High').length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Share2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Organizational Connectivity</h2>
                    <p className="text-sm text-neutral-500">
                        {loading ? "Loading from Neo4j..." : data?.hasData ? "Live data from Neo4j Graph" : "Demo data (Neo4j unavailable)"}
                    </p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Collaboration Score"
                    value={loading ? "..." : `${collaborationScore}/100`}
                    trend={collaborationScore > 70 ? "up" : "down"}
                    trendValue={data?.hasData ? "Live" : "Demo"}
                    icon={Network}
                />
                <MetricCard
                    title="Silo Risk"
                    value={highRiskCount > 0 ? "High" : siloAlerts.length > 0 ? "Medium" : "Low"}
                    trend={highRiskCount > 0 ? "active" : "neutral"}
                    trendValue={`${siloAlerts.length} alerts`}
                    icon={Users}
                    className={highRiskCount > 0 ? "border-red-200 dark:border-red-900/50" : "border-orange-200 dark:border-orange-900/50"}
                />
                <MetricCard
                    title="Team Connections"
                    value={loading ? "..." : `${chartData.length}`}
                    trend="neutral"
                    trendValue="Active Pairs"
                    icon={Share2}
                />
                <MetricCard
                    title="Teams Tracked"
                    value={loading ? "..." : `${data?.teams?.length || 0}`}
                    trend="neutral"
                    trendValue="In Graph"
                    icon={MessageSquare}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Interaction Map */}
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Team Interaction Matrix</h3>
                    <p className="text-xs text-neutral-500 mb-4">Derived from shared project contributions in Neo4j</p>
                    <div className="h-[300px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <XAxis type="number" dataKey="x" name="Project Overlap" tick={false} stroke="#888888" />
                                    <YAxis type="number" dataKey="y" name="Contribution Flow" tick={false} stroke="#888888" />
                                    <ZAxis type="number" dataKey="z" range={[300, 2000]} name="Volume" />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-zinc-900 border border-zinc-700/50 p-3 rounded-lg shadow-xl">
                                                        <p className="font-semibold text-white text-sm mb-1">{data.name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.fill }}></span>
                                                            <span>Volume: <span className="text-white font-medium">{Math.round(data.z / 10)}</span></span>
                                                        </div>
                                                        <div className="text-xs text-zinc-400 mt-1">
                                                            Strength: <span className="text-white font-medium">{data.strength}</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend />
                                    <Scatter name="Team Pairs" data={chartData} fill="#8884d8">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-neutral-500">
                                {loading ? "Loading..." : "No collaboration data found"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Silo Risk Analysis */}
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Silo Detection</h3>
                    <div className="space-y-4">
                        {siloAlerts.length > 0 ? siloAlerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className={`p-4 ${alert.severity === 'High' ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500' : 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500'} rounded-r-lg`}
                            >
                                <h4 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                                    <AlertCircleIcon className={`w-4 h-4 ${alert.severity === 'High' ? 'text-red-500' : 'text-orange-500'}`} />
                                    {alert.teams}
                                </h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                    {alert.message}
                                </p>
                                {alert.recommendation && (
                                    <div className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400">
                                        💡 {alert.recommendation}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 rounded-r-lg">
                                <h4 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    No Silos Detected
                                </h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                    All teams are collaborating effectively.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AlertCircleIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
    )
}

function CheckCircleIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    )
}
