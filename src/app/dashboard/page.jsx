"use client";

import React, { useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HeaderNavbar from '@/components/HeaderNavbar';
import HRDashboard from '@/components/dashboard/HRDashboard';
import TeamLeadDashboard from '@/components/dashboard/TeamLeadDashboard';
import DeveloperDashboard from '@/components/dashboard/DeveloperDashboard';
import HumanEvaluation from '@/components/dashboard/HumanEvaluation';
import AIInsightsView from '@/components/dashboard/advanced/AIInsightsView';
import FinancialsView from '@/components/dashboard/advanced/FinancialsView';
import CrossTeamView from '@/components/dashboard/advanced/CrossTeamView';
import { UserCircle, ChevronDown } from 'lucide-react';

const ROLES = {
    ADMIN: "Engineering Leader",
    HR: "HR Manager",
    LEAD: "Team Lead",
    DEV: "Developer"
};

const getNavLinks = (role) => {
    switch (role) {
        case ROLES.HR:
            return [
                { name: "Overview", href: "#overview" },
                { name: "Retention Risk", href: "#retention" },
            ];
        case ROLES.LEAD:
            return [
                { name: "Overview", href: "#overview" },
                { name: "Team Health", href: "#team" },
            ];
        case ROLES.DEV:
            return [
                { name: "Overview", href: "#overview" },
            ];
        case ROLES.ADMIN:
        default:
            return [
                { name: "AI Insights", href: "#ai" },
                { name: "Financials", href: "#financials" },
                { name: "Collaboration", href: "#collab" },
                { name: "Talent (HR)", href: "#hr" },
                { name: "Delivery (Lead)", href: "#delivery" },
                { name: "Quality (Dev)", href: "#quality" },
            ];
    }
};

function DashboardContent() {
    const searchParams = useSearchParams();
    const roleParam = searchParams.get('role');

    // Map query param to Role Name
    const initialRole = roleParam
        ? ROLES[roleParam] || ROLES.ADMIN
        : ROLES.ADMIN;

    const roleParamRole = roleParam && ROLES[roleParam] ? ROLES[roleParam] : null;

    const [roleOverride, setRoleOverride] = useState(false);
    const [manualRole, setManualRole] = useState(initialRole);

    const currentRole = roleOverride ? manualRole : (roleParamRole || manualRole);

    const navLinks = useMemo(() => getNavLinks(currentRole), [currentRole]);
    const defaultView = navLinks?.[0]?.name || "Overview";

    const [viewOverride, setViewOverride] = useState(false);
    const [manualView, setManualView] = useState(() => {
        const links = getNavLinks(initialRole);
        return links?.[0]?.name || "Overview";
    });

    const currentView = useMemo(() => {
        if (!viewOverride) return defaultView;
        const isValid = navLinks.some((link) => link.name === manualView);
        return isValid ? manualView : defaultView;
    }, [defaultView, manualView, navLinks, viewOverride]);
    const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

    const renderOverview = () => {
        switch (currentRole) {
            case ROLES.HR:
                return (
                    <div className="animate-in fade-in duration-500">
                        <HRDashboard />
                    </div>
                );
            case ROLES.LEAD:
                return (
                    <div className="animate-in fade-in duration-500">
                        <TeamLeadDashboard />
                    </div>
                );
            case ROLES.DEV:
                return (
                    <div className="animate-in fade-in duration-500">
                        <DeveloperDashboard />
                    </div>
                );
            case ROLES.ADMIN:
            default:
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* High-level strategic insights not found elsewhere */}
                        <AIInsightsView />

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <FinancialsView />
                            <CrossTeamView />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-900 dark:text-white font-sans">
            <HeaderNavbar
                customNavItems={navLinks}
                onLinkClick={(name) => {
                    setManualView(name);
                    setViewOverride(true);
                }}
                activeItem={currentView}
            />

            <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-400 mx-auto pb-10">

                {/* Role Switcher for Demo */}
                <div className="flex justify-end items-center mb-4">

                    <div className="relative">
                        <button
                            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                            className="flex items-center gap-2 bg-white/50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg shadow-sm hover:bg-white dark:hover:bg-zinc-800 transition-colors text-sm"
                        >
                            <UserCircle className="w-4 h-4 text-neutral-500" />
                            <span className="font-medium text-neutral-600 dark:text-neutral-300">View as: {currentRole}</span>
                            <ChevronDown className="w-3 h-3 text-neutral-400" />
                        </button>

                        {isRoleMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                                {Object.values(ROLES).map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => {
                                            setRoleOverride(true);
                                            setManualRole(role);
                                            setManualView(getNavLinks(role)?.[0]?.name || "Overview");
                                            setViewOverride(false);
                                            setIsRoleMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${currentRole === role
                                            ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium"
                                            : "hover:bg-neutral-50 dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-300"
                                            }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-2">
                    {/* Render components based on View Name */}

                    {currentView === "Overview" && renderOverview()}

                    {/* Specific Advanced Views (Admin only) */}
                    {currentView === "AI Insights" && <AIInsightsView />}
                    {currentView === "Financials" && <FinancialsView />}
                    {currentView === "Collaboration" && <CrossTeamView />}

                    {/* Secondary Tabs */}
                    {(currentView === "Retention Risk" || currentView === "Team Health" || currentView === "Talent (HR)") && <HRDashboard />}

                    {currentView === "Delivery (Lead)" && <TeamLeadDashboard />}
                    {currentView === "Quality (Dev)" && <DeveloperDashboard />}

                    {/* Shared */}
                    {currentView === "Human Evaluation" && <HumanEvaluation />}
                </div>
            </main>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-zinc-950">Loading Dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
