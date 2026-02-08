import {
    ShieldCheck,
    Globe,
    Zap,
    Lock,
    BarChart3,
    Code2,
    CheckCircle2
} from "lucide-react";

const features = [
    {
        Icon: ShieldCheck,
        name: "Automated Task Management",
        description: "Seamlessly assign and track tasks on Notion & Jira.",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20"
    },
    {
        Icon: Globe,
        name: "Code & Deployment Ops",
        description: "Review Git commits and monitor deployments automatically.",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20"
    },
    {
        Icon: Lock,
        name: "Secure & Private",
        description: "Enterprise-grade security for your internal data.",
        color: "text-green-500",
        bg: "bg-green-500/10",
        border: "border-green-500/20"
    },
    {
        Icon: Zap,
        name: "Real-time Monitoring",
        description: "Live logs and performance metrics for Sales & HRS.",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20"
    },
    {
        Icon: BarChart3,
        name: "Performance Metrics",
        description: "Track team velocity and issue resolution times.",
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20"
    },
    {
        Icon: Code2,
        name: "Interactive Q&A",
        description: "Ask questions like 'How much time for deployment?'.",
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20"
    }
];

export default function FeaturesSection() {
    return (
        <section id="features" className="py-24 relative overflow-hidden bg-white dark:bg-zinc-950">
            {/* Force HMR Update */}
            <div className="container mx-auto px-4 mb-16 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900 dark:text-white">
                    Built for <span className="text-orange-500">Intelligent Automation</span>
                </h2>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                    Everything you need to automate workflows, monitor teams, and gain insights.
                </p>
            </div>

            {/* Infinite Scroll Container */}
            <div className="mask-linear-fade w-full overflow-hidden">
                <div className="flex w-max animate-scroll hover:[animation-play-state:paused]">
                    {/* Double duplication for seamless -50% translation loop */}
                    {[...features, ...features].map((feature, idx) => (
                        <div
                            key={idx}
                            className={`
                                w-[350px] flex-shrink-0 mr-8 p-6 rounded-2xl border backdrop-blur-sm
                                bg-white/50 dark:bg-black/40
                                ${feature.border}
                                transition-all duration-300 hover:scale-105 hover:bg-white dark:hover:bg-zinc-900
                            `}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.bg}`}>
                                <feature.Icon className={`w-6 h-6 ${feature.color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                                {feature.name}
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
