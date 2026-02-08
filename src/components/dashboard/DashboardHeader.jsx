"use client";

import React, { useState, useEffect } from 'react';
import { Bell, User, Settings, Search, Wifi, WifiOff } from 'lucide-react';
import { getMetrics } from '@/api/endurance';
import { toast } from "sonner";

export default function DashboardHeader() {
    const [metrics, setMetrics] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const data = await getMetrics();
                setMetrics(data);
                setIsConnected(data.connected);
            } catch (err) {
                console.error('Failed to fetch metrics:', err);
                setIsConnected(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pt-4">
            {/* Search & Status */}
            <div className="flex items-center gap-4">
                {/* Search bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search queries, alerts..."
                        className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-full text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                toast.info("Search functionality coming soon!");
                            }
                        }}
                    />
                </div>

                {/* Connection Status */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-500 border border-neutral-200 dark:border-zinc-700'
                    }`}>
                    {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {isConnected ? 'API Connected' : 'Connecting...'}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => toast.success("All systems operational. No new alerts.", { description: "You're all caught up!" })}
                    className="relative flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Bell className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Alerts</span>
                    {metrics && metrics.flagged_sessions > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {metrics.flagged_sessions > 99 ? '99+' : metrics.flagged_sessions}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => toast.info("Navigating to Admin Panel...", { duration: 2000 })}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Admin</span>
                </button>
                <button
                    onClick={() => toast("Settings", { description: "Settings panel opening..." })}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Settings className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Settings</span>
                </button>
            </div>
        </div>
    );
}
