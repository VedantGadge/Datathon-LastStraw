"use client";

import React from "react";
import Link from "next/link";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { cn } from "@/lib/utils";

/**
 * MainCta Component
 * Wraps @/components/ui/interactive-hover-button with Next.js Link
 */
export default function MainCta({
    href = "#",
    children,
    variant = "primary",
    className,
    buttonClassName,
    showArrow = true
}) {

    // Custom Styles mapped to variants
    const getVariantClasses = () => {
        switch (variant) {
            case "orange":
                // Navbar CTA: White bg, Orange dot, Orange text on hover
                // Dark mode: Dark bg, Orange dot, White (or Orange) text
                return "bg-white dark:bg-zinc-950 text-black dark:text-white border-neutral-200 dark:border-zinc-800 hover:text-orange-600 hover:border-orange-200 dark:hover:border-orange-900";
            case "secondary":
                return "bg-white dark:bg-zinc-950 text-neutral-900 dark:text-white border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-900";
            case "primary":
            default:
                // Primary typically stays high contrast or follows brand. 
                // Assuming default interactive button handles 'bg-background' which switches.
                // But we probably want a specific look. Let's force it to be consistent.
                return "text-neutral-900 dark:text-white";
        }
    };

    /**
     * NOTE: The InteractiveHoverButton component internals (dot color) use `bg-primary`.
     * To achieve the "Orange" theme without modifying the UI component directly,
     * we can use Tailwind's `[&_div.bg-primary]:bg-orange-500` selector to override the dot color.
     */
    const orangeOverride = variant === "orange"
        ? "[&_div.bg-primary]:bg-[#FF6F30] [&_.text-primary-foreground]:text-white text-black dark:text-white"
        : "";


    return (
        <Link href={href} className={cn("inline-block", className)}>
            <InteractiveHoverButton
                className={cn(getVariantClasses(), orangeOverride, buttonClassName)}
                showArrow={showArrow}
            >
                {children}
            </InteractiveHoverButton>
        </Link>
    );
}
