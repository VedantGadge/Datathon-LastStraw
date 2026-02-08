"use client";

import { useState } from "react";
import { ReviewSetupForm } from "@/components/ReviewSetupForm";
import { VoiceReviewSession } from "@/components/VoiceReviewSession";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { createSession } from "@/api/hrVoiceAgent";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Toaster, toast } from 'sonner';

export default function HRReviewPage() {
    const [sessionData, setSessionData] = useState(null);
    const [reviewComplete, setReviewComplete] = useState(false);
    const [finalSummary, setFinalSummary] = useState(null);

    const startSession = async (person, month) => {
        try {
            const data = await createSession(person, month);
            setSessionData(data);
        } catch (error) {
            console.error("Failed to start session:", error);
            toast.error("Failed to start session. Please try again.");
        }
    };

    const handleSessionComplete = (result) => {
        setReviewComplete(true);
        setFinalSummary(result);
    };

    return (
        <div className="dark">
            <AuroraBackground>
                <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-4">
                    <Toaster position="top-center" />

                    <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
                        <Link href="/" className="text-white font-bold text-xl tracking-tighter">
                            Endurance<span className="text-orange-500">.ai</span>
                        </Link>
                    </header>

                    <motion.div
                        initial={{ opacity: 0.0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.3,
                            duration: 0.8,
                            ease: "easeInOut",
                        }}
                        className="relative flex flex-col gap-4 items-center justify-center px-4 w-full max-w-4xl"
                    >
                        {!sessionData && !reviewComplete && (
                            <div className="w-full">
                                <div className="text-center mb-12">
                                    <h1 className="text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                                        Monthly Review
                                    </h1>
                                    <p className="font-light text-base md:text-xl text-neutral-200 py-4 max-w-2xl mx-auto">
                                        A voice-guided retrospective on your month's achievements, blockers, and goals.
                                    </p>
                                </div>
                                <ReviewSetupForm onStart={startSession} />
                            </div>
                        )}

                        {sessionData && !reviewComplete && (
                            <VoiceReviewSession
                                sessionId={sessionData.session_id}
                                initialQuestion={sessionData.first_question}
                                onComplete={handleSessionComplete}
                            />
                        )}

                        {reviewComplete && (
                            <div className="w-full max-w-2xl mx-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center space-y-6">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex justify-center"
                                >
                                    <div className="h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                                    </div>
                                </motion.div>

                                <h2 className="text-3xl font-bold text-white">Review Complete!</h2>
                                <p className="text-gray-300">
                                    Thank you for completing your monthly review. Your feedback has been recorded.
                                </p>

                                {finalSummary?.running_summary && (
                                    <div className="bg-white/5 p-6 rounded-lg text-left mt-6">
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Session Summary</h3>
                                        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                                            {finalSummary.running_summary}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-6">
                                    <Link href="/">
                                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                            Return to Dashboard
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </AuroraBackground>
        </div>
    );
}
