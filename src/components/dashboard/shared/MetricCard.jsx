import React from "react";
import { cn } from "@/lib/utils";

export function MetricCard({ title, value, trend, trendValue, icon: Icon, className, description }) {
    const isPositive = trend === "up";
    const isNeutral = trend === "neutral";

    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
            "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-neutral-200/60 dark:border-zinc-800/60",
            "hover:border-orange-500/30 dark:hover:border-orange-500/30",
            "flex flex-col justify-between h-[150px]",
            className
        )}>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent blur-2xl rounded-full pointer-events-none" />

            {/* Header: Title and Icon */}
            <div className="relative flex items-start justify-between min-h-[32px]">
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-tight max-w-[85%] line-clamp-2">
                    {title}
                </h3>
                {Icon && <Icon className="h-4 w-4 text-neutral-400 dark:text-neutral-500 mt-0.5 shrink-0" />}
            </div>

            {/* Content: Value and Trend Stacked */}
            <div className="relative mt-auto pt-2 flex flex-col gap-2 w-full">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white leading-none truncate w-full">
                    {value}
                </span>

                {trendValue && (
                    <div className="flex items-center">
                        <span className={cn(
                            "text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border",
                            isPositive ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" :
                                isNeutral ? "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20" :
                                    "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                        )}>
                            {trendValue}
                        </span>
                    </div>
                )}
            </div>

            {description && (
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2 truncate">{description}</p>
            )}
        </div>
    );
}
