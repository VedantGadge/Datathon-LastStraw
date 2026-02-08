"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileText, Download, Loader2 } from 'lucide-react';
import { getMetrics, getSessions } from '@/api/endurance';

export default function ComplianceReport() {
    const [metrics, setMetrics] = useState(null);
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsData, sessionsData] = await Promise.all([
                    getMetrics(),
                    getSessions({ limit: 10, flagged_only: true })
                ]);

                setMetrics(metricsData);

                // Transform flagged sessions into violations
                const violationsList = sessionsData.sessions.slice(0, 3).map((session) => ({
                    id: session.session_id,
                    code: `RTI-${session.flag_reasons?.[0]?.toUpperCase().replace(/\s/g, '-').substring(0, 8) || 'UNKNOWN'}-001`,
                    description: session.flag_reasons?.[0] || 'Compliance issue detected',
                    time: new Date(session.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    status: session.overall_score < 40 ? 'Under Review' : 'Resolved',
                    severity: session.overall_score < 40 ? 'high' : 'low'
                }));

                setViolations(violationsList);
            } catch (err) {
                console.error('Failed to fetch compliance data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    // Calculate compliance scores from metrics
    const rtiCompliance = metrics ? Math.round(100 - (metrics.flagged_percentage * 0.3)) : null;
    const dpdpCompliance = metrics ? Math.round(100 - (metrics.flagged_percentage * 0.6)) : null;

    if (loading) {
        return (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">Compliance Status</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Based on {metrics?.total_sessions || 0} evaluated sessions
                    </p>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" /> Export Report
                </button>
            </div>

            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                {/* RTI Card */}
                <div className={`flex-1 min-w-[140px] p-4 rounded-xl border ${rtiCompliance >= 90
                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20'
                    : rtiCompliance >= 70
                        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
                        : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                    }`}>
                    <p className={`text-xs font-bold uppercase mb-1 ${rtiCompliance >= 90 ? 'text-emerald-700 dark:text-emerald-400' :
                        rtiCompliance >= 70 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'
                        }`}>RTI Act</p>
                    <div className={`text-2xl font-bold ${rtiCompliance >= 90 ? 'text-emerald-800 dark:text-emerald-300' :
                        rtiCompliance >= 70 ? 'text-amber-800 dark:text-amber-300' : 'text-red-800 dark:text-red-300'
                        }`}>{rtiCompliance}%</div>
                    <span className={`text-xs font-medium ${rtiCompliance >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                        rtiCompliance >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                        }`}>{rtiCompliance >= 90 ? '✅ Compliant' : rtiCompliance >= 70 ? '⚠️ Warning' : '❌ Non-Compliant'}</span>
                </div>

                {/* DPDP Card */}
                <div className={`flex-1 min-w-[140px] p-4 rounded-xl border ${dpdpCompliance >= 90
                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20'
                    : dpdpCompliance >= 70
                        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
                        : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                    }`}>
                    <p className={`text-xs font-bold uppercase mb-1 ${dpdpCompliance >= 90 ? 'text-emerald-700 dark:text-emerald-400' :
                        dpdpCompliance >= 70 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'
                        }`}>DPDP Act</p>
                    <div className={`text-2xl font-bold ${dpdpCompliance >= 90 ? 'text-emerald-800 dark:text-emerald-300' :
                        dpdpCompliance >= 70 ? 'text-amber-800 dark:text-amber-300' : 'text-red-800 dark:text-red-300'
                        }`}>{dpdpCompliance}%</div>
                    <span className={`text-xs font-medium ${dpdpCompliance >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                        dpdpCompliance >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                        }`}>{dpdpCompliance >= 90 ? '✅ Compliant' : dpdpCompliance >= 70 ? '⚠️ Warning' : '❌ Non-Compliant'}</span>
                </div>

                {/* GDPR Card */}
                <div className="flex-1 min-w-[140px] p-4 bg-neutral-50 dark:bg-zinc-800 rounded-xl border border-neutral-100 dark:border-zinc-700">
                    <p className="text-xs font-bold text-neutral-500 uppercase mb-1">GDPR</p>
                    <div className="text-2xl font-bold text-neutral-400">N/A</div>
                    <span className="text-xs text-neutral-400">Not Applicable</span>
                </div>
            </div>

            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Recent Violations</h4>
            <div className="space-y-3">
                {violations.length === 0 ? (
                    <div className="flex gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                        <FileText className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">No recent violations</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">All responses are compliant</p>
                        </div>
                    </div>
                ) : (
                    violations.map((violation) => (
                        <div key={violation.id} className={`flex gap-3 p-3 rounded-lg border ${violation.severity === 'high'
                            ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20'
                            : 'bg-neutral-50 dark:bg-zinc-800/30 border-neutral-100 dark:border-zinc-800'
                            }`}>
                            {violation.severity === 'high' ? (
                                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            ) : (
                                <FileText className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <p className={`text-sm font-medium ${violation.severity === 'high'
                                    ? 'text-orange-900 dark:text-orange-200'
                                    : 'text-neutral-700 dark:text-neutral-300'
                                    }`}>{violation.code}: {violation.description}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                                    <span>Time: {violation.time}</span>
                                    <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                                    <span className={violation.status === 'Resolved' ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                                        {violation.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
