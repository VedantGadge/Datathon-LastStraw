"use client";

import React, { useState } from "react";
import { AlertTriangle, AlertCircle, ArrowUp, Loader2, RefreshCw, X, ChevronDown, CheckCircle, Info, Activity, ShieldCheck, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AnomalyPanel() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [projectId, setProjectId] = useState("");
    const [daysCurrent, setDaysCurrent] = useState(7);
    const [daysBaseline, setDaysBaseline] = useState(30);

    const runScan = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/anomalies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: projectId.trim() || undefined,
                    days_current: Number(daysCurrent) || 7,
                    days_baseline: Number(daysBaseline) || 30,
                }),
            });
            const json = await res.json();
            if (!res.ok || json?.status === "error") {
                setData(null);
                setError(json?.alert_text || "Failed to scan");
                return;
            }

            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-amber-500";
        return "text-red-500";
    };

    const getScoreBg = (score) => {
        if (score >= 80) return "bg-green-500";
        if (score >= 60) return "bg-amber-500";
        return "bg-red-500";
    };

    return (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-neutral-200/60 dark:border-zinc-800/60 rounded-xl p-6 shadow-sm flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <Activity className="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Anomaly Detection</h3>
                        <p className="text-xs text-neutral-500">AI-Powered Engineering Analysis</p>
                    </div>
                </div>
                <button
                    onClick={runScan}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                >
                    <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Scanning..." : "Run System Scan"}
                </button>
            </div>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Project ID</label>
                    <input
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        placeholder="optional"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Current window (days)</label>
                    <input
                        type="number"
                        min={1}
                        max={90}
                        value={daysCurrent}
                        onChange={(e) => setDaysCurrent(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Baseline window (days)</label>
                    <input
                        type="number"
                        min={1}
                        max={365}
                        value={daysBaseline}
                        onChange={(e) => setDaysBaseline(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                    />
                </div>
            </div>

            <div className="flex-1">
                {!data && !loading && !error && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                        <ShieldCheck className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
                        <p className="text-sm text-neutral-500">Run a scan to detect engineering anomalies.</p>
                    </div>
                )}

                {loading && (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-neutral-100 dark:border-zinc-800"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 animate-pulse">Analyzing DORA metrics...</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                        <div className="flex items-center gap-2 font-semibold mb-1">
                            <AlertCircle className="w-4 h-4" />
                            Error
                        </div>
                        {error}
                    </div>
                )}

                {data && !loading && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Score & Summary */}
                            <div className="flex items-stretch gap-6">
                                <div className="flex-shrink-0 flex flex-col items-center justify-center w-32 bg-neutral-50 dark:bg-zinc-900/50 rounded-xl border border-neutral-100 dark:border-zinc-800 p-4">
                                    <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                        {data.quality_score}
                                    </span>
                                    <span className="text-xs font-medium text-neutral-500 mt-1 uppercase tracking-wider">Quality Score</span>
                                    <div className="w-full h-1.5 bg-neutral-200 dark:bg-zinc-700 rounded-full mt-3 overflow-hidden">
                                        <div className={`h-full rounded-full ${getScoreBg(data.quality_score)}`} style={{ width: `${data.quality_score}%` }} />
                                    </div>
                                </div>
                                <div className="flex-1 p-4 bg-gradient-to-br from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-900/50 rounded-xl border border-neutral-100 dark:border-zinc-800 flex flex-col justify-center">
                                    <div className="text-sm font-medium text-neutral-900 dark:text-white mb-1 prose dark:prose-invert prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {data.alert_text || "System analysis complete."}
                                        </ReactMarkdown>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                                            Analyzed in {(data.elapsed_s ?? 0).toFixed(2)}s
                                        </span>
                                        {data.anomaly_count > 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-medium border border-red-200 dark:border-red-800">
                                                {data.anomaly_count} Anomalies Found
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-medium border border-green-200 dark:border-green-800">
                                                System Healthy
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Anomalies List */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                                    Insights & Anomalies
                                </h4>
                                {data.anomalies.length > 0 ? (
                                    data.anomalies.map((anomaly, idx) => (
                                        <div key={idx} className="group p-4 bg-white dark:bg-zinc-800/50 border border-neutral-100 dark:border-zinc-800 rounded-xl shadow-sm hover:border-rose-200 dark:hover:border-rose-900 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    {anomaly.severity.toLowerCase() === 'critical' ? (
                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                    ) : anomaly.severity.toLowerCase() === 'warning' ? (
                                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                    ) : (
                                                        <Info className="w-4 h-4 text-blue-500" />
                                                    )}
                                                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{anomaly.metric}</span>
                                                    <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-zinc-700 text-[10px] text-neutral-500 font-mono">
                                                        {anomaly.deviation}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${anomaly.severity.toLowerCase() === 'critical' ? 'bg-red-100 text-red-700' :
                                                    anomaly.severity.toLowerCase() === 'warning' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {anomaly.severity}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                                                {anomaly.root_cause || anomaly.description}
                                            </p>
                                            {anomaly.recommendation && (
                                                <div className="flex items-start gap-2 p-2 bg-neutral-50 dark:bg-zinc-900 rounded-lg text-xs">
                                                    <span className="font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">Fix:</span>
                                                    <span className="text-neutral-600 dark:text-neutral-400">{anomaly.recommendation}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 text-sm bg-neutral-50/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-neutral-200 dark:border-zinc-800">
                                        No critical anomalies detected in the current window.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
