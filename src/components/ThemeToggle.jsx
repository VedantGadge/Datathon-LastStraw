"use client"

import { useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }) {
    const [isDark, setIsDark] = useState(false) // Default to light mode for now since the site is light

    return (
        <div
            className={cn(
                "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300",
                isDark
                    ? "bg-zinc-950 border border-zinc-800"
                    : "bg-white border border-zinc-200",
                className
            )}
            onClick={() => setIsDark(!isDark)}
            role="button"
            tabIndex={0}
        >
            <div className="flex justify-between items-center w-full">
                {/* Toggle Head */}
                <div
                    className={cn(
                        "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300 shadow-sm",
                        isDark
                            ? "transform translate-x-8 bg-zinc-800"
                            : "transform translate-x-0 bg-gray-100"
                    )}
                >
                    {isDark ? (
                        <Moon
                            className="w-4 h-4 text-white"
                            strokeWidth={1.5}
                        />
                    ) : (
                        <Sun
                            className="w-4 h-4 text-orange-500"
                            strokeWidth={1.5}
                        />
                    )}
                </div>

                {/* Background Icons (Visible when toggle is away) */}
                <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
                    <div className={cn("transition-opacity duration-300", isDark ? "opacity-100" : "opacity-0")}>
                        <Sun className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                    </div>
                    <div className={cn("transition-opacity duration-300", isDark ? "opacity-0" : "opacity-100")}>
                        <Moon className="w-4 h-4 text-black" strokeWidth={1.5} />
                    </div>
                </div>
            </div>
        </div>
    )
}
