"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X } from "lucide-react";
import MainCta from "./MainCta";
import { ThemeSwitch } from "./ThemeSwitch";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { EnduranceLogo } from "@/components/ui/EnduranceLogo";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { name: "Features", href: "#features" },
    { name: "Integration", href: "#integration" },
    { name: "Pricing", href: "#pricing" },
];

export default function HeaderNavbar({ customNavItems, onLinkClick, activeItem }) {
    const items = customNavItems || navItems;
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const scrolled = latest > 20;
        if (scrolled !== isScrolled) {
            setIsScrolled(scrolled);
        }
    });

    return (
        <>
            <motion.nav
                className={cn(
                    "fixed inset-x-0 z-50 px-4 sm:px-6 transition-all duration-300 flex justify-center overflow-hidden no-scrollbar",
                    isScrolled ? "top-4" : "top-8"
                )}
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="w-full lg:w-fit max-w-full overflow-hidden no-scrollbar">
                    <div
                        className={cn(
                            "flex items-center justify-between lg:justify-start lg:gap-8 pl-4 pr-5 sm:pr-6 py-3 rounded-full transition-all duration-300 w-full max-w-full overflow-hidden",
                            isScrolled
                                ? "bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/20 dark:border-zinc-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]"
                                : "bg-transparent border border-transparent"
                        )}
                    >
                        {/* Logo */}
                        <Link href="/" className="shrink-0">
                            <div className="flex items-center gap-1.5">
                                <EnduranceLogo className="h-8 w-8" />
                                <span className="text-base font-medium tracking-wide bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                                    Endurance
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden lg:flex items-center gap-6 flex-nowrap whitespace-nowrap overflow-x-hidden no-scrollbar">
                            {items.map((item) => {
                                const isActive = activeItem === item.name;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => {
                                            if (onLinkClick) {
                                                e.preventDefault();
                                                onLinkClick(item.name);
                                            }
                                        }}
                                        className={cn(
                                            "relative px-3 py-1.5 text-sm font-medium transition-colors duration-300 whitespace-nowrap z-10",
                                            isActive
                                                ? "text-orange-600 dark:text-orange-400"
                                                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                        )}
                                    >
                                        {item.name}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeNavIndicator"
                                                className="absolute inset-0 bg-orange-50 dark:bg-orange-900/20 rounded-full -z-10"
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                                initial={false}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right Side (Button + Mobile Toggle) */}
                        <div className="flex items-center gap-2.5">
                            <ThemeSwitch />
                            {!customNavItems && (
                                <>
                                    {/* <Link href="/signup" className="hidden md:inline-block text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-500 transition-colors mr-2">
                                    Sign Up
                                </Link> */}
                                    <MainCta href="/login" variant="orange" className="hidden md:inline-block">
                                        Login
                                    </MainCta>
                                </>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors dark:text-white"
                            >
                                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.nav >

            {/* Mobile Menu Overlay */}
            < AnimatePresence >
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.div
                            initial={{ y: -20, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -20, opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-20 left-4 right-4 z-50 lg:hidden bg-white dark:bg-zinc-950 rounded-2xl shadow-xl overflow-hidden border border-neutral-100 dark:border-zinc-800 p-4"
                        >
                            <div className="flex flex-col gap-2">
                                <div className="px-4 py-2 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                                    Pages
                                </div>
                                {items.map((item) => {
                                    const isActive = activeItem === item.name;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={(e) => {
                                                setIsMobileMenuOpen(false);
                                                if (onLinkClick) {
                                                    e.preventDefault();
                                                    onLinkClick(item.name);
                                                }
                                            }}
                                            className={cn(
                                                "px-4 py-3 text-sm font-medium rounded-xl transition-colors flex items-center justify-between",
                                                isActive
                                                    ? "text-neutral-900 dark:text-white"
                                                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-zinc-900"
                                            )}
                                        >
                                            {item.name}
                                            {isActive && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                            )}
                                        </Link>
                                    );
                                })}

                                <div className="h-px bg-neutral-100 dark:bg-zinc-800 my-2" />

                                <div className="px-4 py-2 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                                    Account
                                </div>
                                <Link
                                    href="#"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-4 py-3 text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-900 rounded-xl transition-colors"
                                >
                                    Contact via Email
                                </Link>
                                <Link
                                    href="#"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-4 py-3 text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-900 rounded-xl transition-colors"
                                >
                                    Terms & Conditions
                                </Link>

                                {!customNavItems && (
                                    <div className="mt-4">
                                        <MainCta href="/dashboard" variant="orange" className="w-full text-center">
                                            Login
                                        </MainCta>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )
                }
            </AnimatePresence >
        </>
    );
}
