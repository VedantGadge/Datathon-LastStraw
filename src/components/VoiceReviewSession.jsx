"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, CornerDownLeft, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { postSessionTurn, synthesizeAudio } from "@/api/hrVoiceAgent";
import { cn } from "@/lib/utils";

export function VoiceReviewSession({ sessionId, initialQuestion, onComplete }) {
    const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = "en-US";

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = "";
                let finalTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Append final to existing transcript state if needed, or just update current view
                // Ideally we'd keep a running log, but here we just want the current turn's answer
                setTranscript((prev) => {
                    // If we have a final result, append it. 
                    // NOTE: This logic can be tricky with React state. 
                    // Simpler approach: construct full string from the start of this recording session?
                    // "continuous" mode keeps appending results.
                    return finalTranscript + interimTranscript;
                });

                // Better approach for React driven updates with continuous:
                // Actually, let's just use the event results directly combined with a "session start" offset if needed.
                // For simplicity:
                const currentText = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                setTranscript(currentText);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                // Auto-restart if we think we should still be listening?
                // For now, let it stop.
                setIsListening(false);
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Speak question on change
    useEffect(() => {
        if (currentQuestion) {
            speakText(currentQuestion);
        }
    }, [currentQuestion]);

    const speakText = async (text) => {
        try {
            // Try to stop any current audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            // Browser Speech Synthesis fallback (lower latency, free)
            // const utterance = new SpeechSynthesisUtterance(text);
            // window.speechSynthesis.speak(utterance);

            // OR Use API TTS
            setIsSpeaking(true);
            const audioBlob = await synthesizeAudio(text);
            const audioUrl = URL.createObjectURL(audioBlob);
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => setIsSpeaking(false);
            audioRef.current.play();

        } catch (err) {
            console.error("TTS Error:", err);
            setIsSpeaking(false);
            // Fallback to browser
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    const stopSpeaking = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }

    const toggleRecording = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            stopSpeaking(); // Stop AI talking when user wants to speak
            setTranscript(""); // Clear previous turn's text? Or keep conversation history? 
            // The API expects just the "transcript_text" for the *current* turn.
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const submitAnswer = async () => {
        if (!transcript.trim()) return;

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }

        setIsProcessing(true);
        try {
            const response = await postSessionTurn(sessionId, transcript);

            if (response.done) {
                onComplete(response);
            } else {
                setCurrentQuestion(response.assistant_question);
                setTranscript(""); // Clear for next turn
            }
        } catch (error) {
            console.error("Error submitting turn:", error);
            // Show error toast
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            {/* AI Question Area */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                <Card className="bg-black/40 backdrop-blur-md border-white/10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 to-amber-600" />
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-mono text-orange-400 uppercase tracking-widest">AI Interviewer</span>
                            {isSpeaking ? (
                                <Volume2 className="h-4 w-4 text-orange-400 animate-pulse cursor-pointer" onClick={stopSpeaking} />
                            ) : (
                                <div className="h-4 w-4" />
                            )}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-light text-white leading-relaxed">
                            {currentQuestion}
                        </h2>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Visualizer / Status */}
            <div className="flex justify-center h-24 items-center">
                {isListening ? (
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-2 bg-gradient-to-t from-orange-500 to-amber-500 rounded-full"
                                animate={{ height: [10, 40, 10] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 0.8,
                                    delay: i * 0.1,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>
                ) : isProcessing ? (
                    <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                ) : (
                    <div className="text-gray-500 text-sm font-light">Waiting for your response...</div>
                )}
            </div>

            {/* User Interaction Area */}
            <div className="relative">
                <Card className={cn(
                    "bg-white/5 border-white/10 transition-all duration-300",
                    isListening ? "border-orange-500/30 bg-orange-500/5" : ""
                )}>
                    <CardContent className="p-6 min-h-[150px] flex flex-col justify-between">
                        <div className="text-lg text-gray-200 font-light whitespace-pre-wrap">
                            {transcript || <span className="text-gray-600 italic">Tap the microphone to start speaking...</span>}
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                            <Button
                                variant={isListening ? "destructive" : "secondary"}
                                size="icon"
                                className={cn(
                                    "h-14 w-14 rounded-full shadow-lg transition-all",
                                    isListening ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20 text-white"
                                )}
                                onClick={toggleRecording}
                            >
                                {isListening ? <Square className="h-6 w-6 fill-current" /> : <Mic className="h-6 w-6" />}
                            </Button>

                            <Button
                                onClick={submitAnswer}
                                disabled={!transcript || isProcessing}
                                className="bg-white text-black hover:bg-gray-200 px-8 py-6 rounded-full font-medium"
                            >
                                Submit Response <CornerDownLeft className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
