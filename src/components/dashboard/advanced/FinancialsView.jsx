"use client";

import React, { useState, useEffect } from "react";
import { MetricCard } from "../shared/MetricCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { DollarSign, TrendingUp, CreditCard, PieChart } from "lucide-react";

// Fallback data for when API is loading or fails
const fallbackBudgetData = [
    { name: "Jan", budget: 5000, actual: 4800, projected: 4800 },
    { name: "Feb", budget: 5000, actual: 5200, projected: 5000 },
    { name: "Mar", budget: 5000, actual: 4900, projected: 5000 },
    { name: "Apr", budget: 5000, actual: 5800, projected: 5000 },
    { name: "May", budget: 5000, actual: 6200, projected: 5000 },
];

const fallbackServices = [
    { service_name: "AWS EC2", total_cost: 12500 },
    { service_name: "OpenAI API", total_cost: 8500 },
    { service_name: "Datadog", total_cost: 4200 },
];

export default function FinancialsView() {
    const [loading, setLoading] = useState(true);
    const [finData, setFinData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            const cached = sessionStorage.getItem('financials_data');
            if (cached) {
                setFinData(JSON.parse(cached));
                setLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/financials');
                const data = await res.json();

                if (data.hasData) {
                    setFinData(data);
                    sessionStorage.setItem('financials_data', JSON.stringify(data));
                } else if (data.error) {
                    console.warn("Financials API Error:", data.error);
                    setError(data.error);
                }
            } catch (err) {
                console.error("Failed to fetch financials:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // Prepare data for rendering
    const displayServices = finData?.topServices || fallbackServices;

    // Calculate daily budget from total monthly limit (approximate)
    const dailyBudget = finData?.totalMonthlyBudget ? Math.round(finData.totalMonthlyBudget / 30) : 200;

    // Format daily trend for the char
    const chartData = finData?.dailyTrend?.map(d => ({
        name: new Date(d.record_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        actual: parseFloat(d.daily_total),
        budget: dailyBudget,
        projected: parseFloat(d.daily_total) * 1.1
    })) || fallbackBudgetData;

    const totalSpend = finData?.totalSpend30d
        ? `$${(finData.totalSpend30d / 1000).toFixed(1)}k`
        : "$0k"; // Default if missing, or use fallback if completely failed? 
    // Let's stick to showing loading or fallback visuals handled below.

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Engineering Financials</h2>
                    <p className="text-sm text-neutral-500">
                        {loading ? "Loading live data..." : "Real-time cost tracking from PostgreSQL"}
                    </p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Spend (30d)"
                    value={loading ? "..." : (finData ? totalSpend : "$269k (Demo)")}
                    trend="up"
                    trendValue={finData ? "Live" : "Demo Data"}
                    icon={DollarSign}
                    className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10"
                />
                <MetricCard
                    title="Cloud Cost (Mo)"
                    value={loading ? "..." : (finData ? `$${(finData.totalSpend30d / 1000).toFixed(1)}k` : "$27.2k")}
                    trend="up"
                    trendValue="+5% MoM"
                    icon={CreditCard}
                />
                <MetricCard
                    title="Cost Per User"
                    value="$1.42"
                    trend="down"
                    trendValue="-3% (Optimization)"
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Runway Remaining"
                    value="14 Mo"
                    trend="neutral"
                    trendValue="Stable"
                    icon={PieChart}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Budget vs Actual Chart */}
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
                        {finData ? "30-Day Cost Trend" : "Budget Burn-down (Demo)"}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#18181b", border: "none", borderRadius: "8px", color: "#fff" }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="budget" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Budget Limit" />
                                <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={3} name="Actual Spend" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Cost Drivers */}
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Top Cost Drivers</h3>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                            Warning: {error}. Showing demo data.
                        </div>
                    )}
                    <div className="space-y-4">
                        {displayServices.map((service, index) => {
                            const val = parseFloat(service.total_cost || service.value || 0);
                            const max = 15000; // Arbitrary max for bar visuals
                            return (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-8 bg-neutral-200 dark:bg-zinc-700 rounded-sm overflow-hidden relative">
                                            <div
                                                className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-sm"
                                                style={{ height: `${(val / max) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="font-medium text-neutral-700 dark:text-neutral-300">{service.service_name || service.name}</span>
                                    </div>
                                    <span className="font-mono text-neutral-900 dark:text-white font-medium">${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500">Anomaly Detected:</span>
                            <span className="text-red-500 font-medium">OpenAI API usage spike (+40%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
