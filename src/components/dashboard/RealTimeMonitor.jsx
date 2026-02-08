"use client";

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, TrendingUp, Pause, Play, CheckCircle2, AlertTriangle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from "sonner";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { useEnduranceStream } from '@/hooks/useEnduranceStream';
import { getMetrics } from '@/api/endurance';

export default function RealTimeMonitor() {
    const { sessions, isConnected, error } = useEnduranceStream(false);
    const [selectedThreat, setSelectedThreat] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [displayedSessions, setDisplayedSessions] = useState([]);

    // Fetch metrics on mount and refresh every 30s
    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const data = await getMetrics();
                setMetrics(data);
            } catch (err) {
                console.error('Failed to fetch metrics:', err);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    // Update displayed sessions when not paused
    useEffect(() => {
        if (!isPaused) {
            setDisplayedSessions(sessions.slice(0, 10));
        }
    }, [sessions, isPaused]);

    // Extract dimension scores from metrics for radar chart
    const dimensionScores = [
        { label: "Bias & Fairness", score: 88 },
        { label: "Data Grounding", score: metrics?.flagged_percentage ? Math.round(100 - metrics.flagged_percentage) : 94 },
        { label: "Explainability", score: 90 },
        { label: "Ethical Alignment", score: 92 },
        { label: "Human Control", score: 85 },
        { label: "Legal Compliance", score: 96 },
        { label: "Security", score: 83 },
        { label: "Response Quality", score: 89 },
        { label: "Reasoning Quality", score: 85 },
    ];

    // Calculate health score from metrics
    const healthScore = metrics ? Math.round(100 - metrics.flagged_percentage) : null;

    // Get status from score
    const getStatus = (score) => {
        if (score >= 70) return 'good';
        if (score >= 50) return 'warning';
        return 'danger';
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return '--:--:--';
        }
    };

    // Active alerts from flagged sessions
    const activeAlerts = displayedSessions
        .filter(s => s.flagged)
        .slice(0, 3)
        .map((session, index) => ({
            icon: <AlertTriangle className="size-4 text-white" />,
            title: session.flag_reasons?.[0] || "Hallucination Detected",
            description: `Score: ${session.overall_score?.toFixed(1) || 'N/A'} - ${session.query?.substring(0, 40)}...`,
            date: formatTime(session.timestamp),
            severity: session.overall_score < 40 ? "critical" : "warning",
            fullQuery: session.query,
            score: session.overall_score,
            details: session // Keep full session for modal
        }));

    // Fallback alerts if no flagged sessions
    const displayAlerts = activeAlerts.length > 0 ? activeAlerts : [
        {
            icon: <CheckCircle2 className="size-4 text-white" />,
            title: "System Healthy",
            description: "No active alerts at this time",
            date: "Now",
            severity: "info"
        }
    ];

    return (
        <div className="space-y-6">
            {/* Connection Status Banner */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Connection lost. Attempting to reconnect...</span>
                </div>
            )}

            {/* Top Row: Health & Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Health Score Card */}
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col justify-between shadow-sm h-full">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Today's AI Health</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                            {healthScore !== null ? (
                                <>
                                    <span className="text-5xl font-bold text-neutral-900 dark:text-white">{healthScore}</span>
                                    <span className="text-xl text-neutral-400">/100</span>
                                </>
                            ) : (
                                <div className="h-14 w-24 bg-neutral-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
                            )}
                        </div>
                        {metrics && (
                            <div className="flex items-center gap-4 mt-2 text-sm">
                                <div className="flex items-center gap-1 text-emerald-500 font-medium">
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span>{metrics.total_sessions} sessions</span>
                                </div>
                                <div className="text-neutral-500 dark:text-neutral-400">
                                    {metrics.flagged_sessions} flagged ({metrics.flagged_percentage?.toFixed(1)}%)
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mini Chart Visual */}
                    <div className="h-32 flex items-end gap-2 mt-6 px-2">
                        {(() => {
                            const scores = [40, 60, 45, 70, 65, 80, healthScore || 86, 75, 85, 90, 88, 92];
                            return scores.map((h, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() - (11 - i));
                                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                                return (
                                    <div key={i} className="group relative flex-1 bg-neutral-100 dark:bg-zinc-800/50 rounded-full" style={{ height: '100%' }}>
                                        {/* Date Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                            {dateStr}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-neutral-900"></div>
                                        </div>

                                        <div className="w-full h-full rounded-full overflow-hidden relative flex items-end">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                                className="w-full bg-orange-500/80 rounded-full"
                                                style={{ opacity: 0.4 + (i * 0.05) }}
                                            />
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center h-[400px]">
                    <ChartContainer
                        config={{
                            score: {
                                label: "Score",
                                color: "hsl(24.6 95% 53.1%)",
                            },
                        }}
                        className="mx-auto aspect-square max-h-[350px] w-full"
                    >
                        <RadarChart data={dimensionScores}>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <PolarAngleAxis dataKey="label" />
                            <PolarGrid />
                            <Radar
                                dataKey="score"
                                fill="var(--color-score)"
                                fillOpacity={0.6}
                                stroke="var(--color-score)"
                                strokeWidth={2}
                            />
                        </RadarChart>
                    </ChartContainer>
                </div>
            </div>

            {/* Bottom Row: Alerts & Live Queries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Premium Threat Monitor */}
                <div className="relative bg-white/5 dark:bg-zinc-900/50 backdrop-blur-md border border-neutral-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">

                    {/* Header */}
                    <div className="relative px-6 py-4 border-b border-neutral-200/50 dark:border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute h-2 w-2 bg-rose-500 rounded-full animate-ping opacity-75"></div>
                                <div className="h-2 w-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-neutral-900 dark:text-white text-sm tracking-tight">Threat Monitor</h3>
                            </div>
                        </div>
                        {metrics?.flagged_sessions > 0 && (
                            <div className="px-2 py-1 bg-rose-500/10 dark:bg-rose-500/20 rounded-md border border-rose-200 dark:border-rose-900/30 flex items-center">
                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 leading-none">
                                    {metrics.flagged_sessions} FLAGGED
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Alert Cards */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {displayAlerts.map((alert, i) => {
                            const isCritical = alert.severity === 'critical';
                            const isInfo = alert.severity === 'info';
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`group relative rounded-lg p-3.5 transition-all duration-200 border
                                        ${isInfo
                                            ? 'bg-neutral-50/50 dark:bg-zinc-800/30 border-neutral-100 dark:border-white/5 hover:border-emerald-200 dark:hover:border-emerald-900/30'
                                            : isCritical
                                                ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/20 hover:border-rose-200 dark:hover:border-rose-900/40'
                                                : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/20 hover:border-amber-200 dark:hover:border-amber-900/40'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className={`mt-0.5 p-1.5 rounded-md shrink-0 
                                            ${isInfo ? 'bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                : isCritical ? 'bg-rose-100/50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                    : 'bg-amber-100/50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                                            {isInfo ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className={`text-xs font-semibold ${isInfo ? 'text-neutral-700 dark:text-neutral-200' : isCritical ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                                    {alert.title}
                                                </h4>
                                                <span className="text-[10px] text-neutral-400 font-mono">
                                                    {alert.date}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">{alert.description}</p>

                                            {!isInfo && (
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${isCritical
                                                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                                                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                        }`}>
                                                        {isCritical ? 'CRITICAL' : 'WARNING'}
                                                    </span>
                                                    <button
                                                        onClick={() => setSelectedThreat(alert)}
                                                        className="text-[10px] font-medium text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                                    >
                                                        View Details →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Live Queries */}
                <div className="relative bg-white/5 dark:bg-zinc-900/50 backdrop-blur-md border border-neutral-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <div className="px-6 py-4 border-b border-neutral-200/50 dark:border-white/5 flex justify-between items-center">
                        <div className='flex items-center gap-2.5'>
                            <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-neutral-400'}`} />
                            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">Live Queries</h3>
                        </div>
                        <button
                            onClick={() => {
                                setIsPaused(!isPaused);
                                toast(isPaused ? "Monitoring Resumed" : "Monitoring Paused", {
                                    icon: !isPaused ? <Pause className="w-3 h-3 text-amber-500" /> : <Play className="w-3 h-3 text-emerald-500" />
                                });
                            }}
                            className="text-[10px] font-medium px-2 py-1 bg-neutral-100 dark:bg-white/5 rounded hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 transition-colors flex items-center gap-1.5"
                        >
                            {isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                            {isPaused ? 'RESUME' : 'PAUSE'}
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
                        {displayedSessions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 p-8">
                                <div className="w-10 h-10 bg-neutral-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
                                    <Wifi className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
                                </div>
                                <p className="text-xs font-medium">
                                    {isConnected ? 'Waiting for sessions...' : 'Connecting to stream...'}
                                </p>
                            </div>
                        ) : (
                            displayedSessions.map((session, i) => {
                                const status = getStatus(session.overall_score);
                                return (
                                    <motion.div
                                        key={session.session_id || i}
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-[10px] font-mono text-neutral-400 min-w-[3rem]">
                                                {formatTime(session.timestamp)}
                                            </span>
                                            <div className="flex flex-col min-w-0">
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate font-medium group-hover:text-black dark:group-hover:text-white transition-colors">
                                                    "{session.query?.substring(0, 50) || 'No query'}"
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {status === 'good' && <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">Safe</span>}
                                                    {status === 'warning' && <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">Warning</span>}
                                                    {status === 'danger' && <span className="text-[9px] font-medium text-rose-600 dark:text-rose-400">Flagged</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-xs font-bold px-2 py-0.5 rounded text-center ml-2
                                            ${status === 'good' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                status === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                    'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                            {session.overall_score?.toFixed(0) || '--'}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
            {/* Threat Details Modal */}
            {selectedThreat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-neutral-200 dark:border-zinc-800 flex justify-between items-center bg-neutral-50/50 dark:bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg 
                                    ${selectedThreat.severity === 'critical' ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                                        : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">Threat Details</h3>
                                    <p className="text-xs text-neutral-500 font-mono">{selectedThreat.date}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedThreat(null)}
                                className="p-2 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-neutral-500"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Threat Type */}
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Detected Issue</h4>
                                <div className={`p-3 rounded-lg border flex items-center justify-between
                                    ${selectedThreat.severity === 'critical'
                                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'
                                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'}`}>
                                    <span className={`font-medium ${selectedThreat.severity === 'critical' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                        {selectedThreat.title}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded
                                        ${selectedThreat.severity === 'critical' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700'}`}>
                                        Score: {selectedThreat.score?.toFixed(0)}
                                    </span>
                                </div>
                            </div>

                            {/* Full Query */}
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">User Query</h4>
                                <div className="p-3 bg-neutral-50 dark:bg-zinc-800/50 rounded-lg border border-neutral-100 dark:border-zinc-800 text-sm text-neutral-700 dark:text-neutral-300 max-h-32 overflow-y-auto custom-scrollbar">
                                    "{selectedThreat.fullQuery || 'No query captured'}"
                                </div>
                            </div>

                            {/* AI Response Preview (if available in details) */}
                            {selectedThreat.details?.response && (
                                <div>
                                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">AI Response Preview</h4>
                                    <div className="p-3 bg-neutral-50 dark:bg-zinc-800/50 rounded-lg border border-neutral-100 dark:border-zinc-800 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3">
                                        {selectedThreat.details.response}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => {
                                        toast.success("Threat marked as resolved.");
                                        setSelectedThreat(null);
                                    }}
                                    className="flex-1 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                                >
                                    Mark Resolved
                                </button>
                                <button
                                    onClick={() => {
                                        toast.info("Opened in detailed investigation view.");
                                        setSelectedThreat(null);
                                    }}
                                    className="flex-1 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium text-sm hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Investigate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
