import Image from "next/image";
import HeaderNavbar from "../components/HeaderNavbar";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import IntegrationSection from "../components/IntegrationSection";
import { Pricing } from "../components/pricing";

export default function Home() {
  return (
    <div className="font-sans text-neutral-900 bg-white dark:bg-zinc-950">
      <HeaderNavbar />

      <HeroSection />

      <FeaturesSection />

      <IntegrationSection />

      {/* <section
        id="benefits"
        className="min-h-[50vh] bg-white dark:bg-zinc-950 flex items-center justify-center border-t border-neutral-100 dark:border-zinc-800"
      >
        <h2 className="text-4xl font-bold text-neutral-300 dark:text-neutral-700">
          Benefits Section
        </h2>
      </section> */}

      <section
        id="pricing"
        className="bg-neutral-50 dark:bg-zinc-900/50 border-t border-neutral-100 dark:border-zinc-800"
      >
        <Pricing
          title="Simple, Transparent Pricing"
          description={
            "Start for free, scale as you grow.\nNo credit card required for the free tier."
          }
          plans={[
            {
              name: "Starter",
              price: "0",
              yearlyPrice: "0",
              period: "month",
              features: [
                "1 Active Agent",
                "Basic Notion Integration",
                "Community Support",
                "7-day Log Retention",
              ],
              description: "Perfect for individuals and small projects",
              buttonText: "Start for Free",
              href: "/signup",
              isPopular: false,
            },
            {
              name: "Pro",
              price: "49",
              yearlyPrice: "39",
              period: "month",
              features: [
                "Unlimited Active Agents",
                "Full Notion, Jira, GitHub Integrations",
                "Priority Email Support",
                "30-day Log Retention",
                "Advanced Insights",
              ],
              description: "For growing teams and startups",
              buttonText: "Get Started",
              href: "/signup",
              isPopular: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              yearlyPrice: "Custom",
              period: "monitoring",
              features: [
                "Unlimited Everything",
                "Dedicated Success Manager",
                "SLA & Custom Contracts",
                "Unlimited Retention",
                "On-premise Deployment",
              ],
              description: "For large scale organizations",
              buttonText: "Contact Sales",
              href: "/contact",
              isPopular: false,
            },
          ]}
        />
      </section>
    </div>
  );
}
