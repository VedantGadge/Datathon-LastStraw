"use client";
import { cn } from "@/lib/utils";
import React from "react";

export const AuroraBackground = ({
    className,
    children,
    showRadialGradient = true,
    ...props
}) => {
    return (
        <main>
            <style jsx>{`
                @keyframes aurora-move {
                    from { background-position: 50% 50%, 50% 50%; }
                    to { background-position: 350% 50%, 350% 50%; }
                }
                .aurora-bg::after {
                    animation: aurora-move 60s linear infinite;
                }
            `}</style>
            <div
                className={cn(
                    "relative flex flex-col  min-h-[100vh] items-center justify-center bg-zinc-50 dark:bg-zinc-900  text-slate-950 transition-bg",
                    className
                )}
                {...props}
            >
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        //   I'm sorry but this is what peak developer performance looks like // trigger warning
                        className={cn(
                            `
            [--white-gradient:repeating-linear-gradient(100deg,var(--color-white)_0%,var(--color-white)_7%,transparent_10%,transparent_12%,var(--color-white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,var(--color-black)_0%,var(--color-black)_7%,transparent_10%,transparent_12%,var(--color-black)_16%)]
            [--aurora:repeating-linear-gradient(100deg,var(--color-orange-500)_10%,var(--color-amber-300)_15%,var(--color-orange-300)_20%,var(--color-red-200)_25%,var(--color-orange-400)_30%)]
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert dark:invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:dark:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:mix-blend-difference
            aurora-bg
            pointer-events-none
            absolute -inset-[10px] opacity-50 will-change-[background-position]`,

                            showRadialGradient &&
                            `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
                        )}
                    ></div>
                </div>
                {children}
            </div>
        </main>
    );
};
