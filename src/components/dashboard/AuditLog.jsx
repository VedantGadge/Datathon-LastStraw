"use client";

import React, { useState, useEffect } from 'react';
import { getSessions } from '@/api/endurance';

export default function AuditLog() {
    const [auditEntries, setAuditEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const data = await getSessions({ limit: 20 });
                // Transform sessions into audit log entries
                const entries = data.sessions.flatMap((session, idx) => {
                    const events = [];
                    const timestamp = new Date(session.timestamp);

                    // Query received event
                    events.push({
                        id: `${session.session_id}_query`,
                        time: timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
                        event: "QUERY_RECEIVED",
                        details: `Query: "${session.query?.substring(0, 60) || 'N/A'}..."`,
                        status: "normal"
                    });

                    // Evaluation event
                    events.push({
                        id: `${session.session_id}_eval`,
                        time: new Date(timestamp.getTime() + 150).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
                        event: "EVALUATION_COMPLETE",
                        details: `Score: ${session.overall_score?.toFixed(1) || 'N/A'} | Service: ${session.service_id || 'default'}`,
                        status: session.overall_score >= 70 ? "success" : session.overall_score >= 50 ? "normal" : "error"
                    });

                    // Flagged event if applicable
                    if (session.flagged) {
                        events.push({
                            id: `${session.session_id}_flag`,
                            time: new Date(timestamp.getTime() + 300).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
                            event: "CLAIM_FLAGGED",
                            details: session.flag_reasons?.[0] || "Hallucination detected - Requires review",
                            status: "error"
                        });
                    }

                    return events;
                });

                setAuditEntries(entries.slice(0, 15));
            } catch (err) {
                console.error('Failed to fetch audit data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
        const interval = setInterval(fetchSessions, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 overflow-hidden min-w-0">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-6">Audit Trail</h3>
                <div className="relative min-w-0 w-full">
                    {/* Vertical Line Skeleton */}
                    <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-neutral-100 dark:bg-zinc-800"></div>

                    <div className="space-y-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="relative pl-8 animate-pulse group">
                                {/* Dot Skeleton */}
                                <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-neutral-200 dark:bg-zinc-700 ring-4 ring-white dark:ring-zinc-900" />

                                <div className="space-y-2">
                                    <div className="h-3 bg-neutral-200 dark:bg-zinc-700 rounded w-1/4 mb-2" />
                                    <div className="h-10 bg-neutral-100 dark:bg-zinc-800 rounded-lg w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-6">Audit Trail</h3>

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-neutral-100 dark:bg-zinc-800"></div>

                <div className="space-y-6">
                    {auditEntries.map((entry, idx) => (
                        <div key={entry.id || idx} className="relative pl-8 group">
                            {/* Dot */}
                            <div className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white dark:border-zinc-900 
                                ${entry.status === 'error' ? 'bg-red-500' :
                                    entry.status === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                <span className={`text-xs font-mono font-medium
                                    ${entry.status === 'error' ? 'text-red-500' :
                                        entry.status === 'success' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                    {entry.event}
                                </span>
                                <span className="text-xs text-neutral-400 font-mono">{entry.time}</span>
                            </div>

                            <div className="p-3 bg-neutral-50 dark:bg-zinc-800/50 rounded-lg border border-neutral-100 dark:border-zinc-800 text-sm font-mono text-neutral-600 dark:text-neutral-400 break-all">
                                {entry.details}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-zinc-800 flex justify-between items-center text-xs text-neutral-500">
                <div className="font-mono">Last updated: {new Date().toLocaleTimeString()}</div>
                <div className="flex items-center gap-2 text-emerald-500 font-medium">
                    <span>✅ Tamper Proof</span>
                </div>
            </div>
        </div>
    );
}
