"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, CornerDownLeft, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { postSessionTurn, synthesizeAudio } from "@/api/hrVoiceAgent";
import { cn } from "@/lib/utils";
import { VoiceSphere3D } from "@/components/VoiceSphere3D";

export function VoiceReviewSession({ sessionId, initialQuestion, onComplete }) {
    const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceLevel, setVoiceLevel] = useState(0);
    const [ttsLevel, setTtsLevel] = useState(0);
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const micStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const rafIdRef = useRef(null);
    const smoothedLevelRef = useRef(0);

    const ttsAudioContextRef = useRef(null);
    const ttsAnalyserRef = useRef(null);
    const ttsSourceRef = useRef(null);
    const ttsRafIdRef = useRef(null);
    const ttsSmoothedLevelRef = useRef(0);

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

    // Mic level meter for the visual sphere (real amplitude while listening)
    useEffect(() => {
        const cleanup = () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }

            if (micStreamRef.current) {
                for (const track of micStreamRef.current.getTracks()) track.stop();
                micStreamRef.current = null;
            }

            analyserRef.current = null;

            if (audioContextRef.current) {
                const ctx = audioContextRef.current;
                audioContextRef.current = null;
                try {
                    ctx.close();
                } catch {
                    // ignore
                }
            }

            smoothedLevelRef.current = 0;
            setVoiceLevel(0);
        };

        const start = async () => {
            if (typeof window === "undefined") return;
            if (!navigator?.mediaDevices?.getUserMedia) return;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                micStreamRef.current = stream;

                const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioContextImpl();
                audioContextRef.current = ctx;

                if (ctx.state === "suspended") {
                    try {
                        await ctx.resume();
                    } catch {
                        // ignore
                    }
                }

                const source = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 1024;
                analyser.smoothingTimeConstant = 0.6;
                source.connect(analyser);
                analyserRef.current = analyser;

                const bufferLength = analyser.fftSize;
                const data = new Uint8Array(bufferLength);

                const tick = () => {
                    if (!analyserRef.current) return;
                    analyserRef.current.getByteTimeDomainData(data);

                    // Compute RMS in [0..1]
                    let sumSquares = 0;
                    for (let i = 0; i < data.length; i++) {
                        const v = (data[i] - 128) / 128;
                        sumSquares += v * v;
                    }
                    const rms = Math.sqrt(sumSquares / data.length);

                    // Slightly boost small signals and smooth
                    const boosted = Math.min(1, rms * 2.2);
                    const prev = smoothedLevelRef.current;
                    const next = prev * 0.85 + boosted * 0.15;
                    smoothedLevelRef.current = next;
                    setVoiceLevel(next);

                    rafIdRef.current = requestAnimationFrame(tick);
                };

                rafIdRef.current = requestAnimationFrame(tick);
            } catch (e) {
                // Permission denied or no mic; fall back to idle sphere
                console.warn("Mic meter unavailable:", e);
                cleanup();
            }
        };

        if (isListening) {
            start();
        } else {
            cleanup();
        }

        return cleanup;
    }, [isListening]);

    const speakText = async (text) => {
        try {
            stopTtsMeter();

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
            audioRef.current.onended = () => {
                stopTtsMeter();
                setIsSpeaking(false);
            };
            startTtsMeter(audioRef.current);
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
        stopTtsMeter();
        setIsSpeaking(false);
    }

    const stopTtsMeter = () => {
        if (ttsRafIdRef.current) {
            cancelAnimationFrame(ttsRafIdRef.current);
            ttsRafIdRef.current = null;
        }

        ttsAnalyserRef.current = null;
        ttsSourceRef.current = null;

        if (ttsAudioContextRef.current) {
            const ctx = ttsAudioContextRef.current;
            ttsAudioContextRef.current = null;
            try {
                ctx.close();
            } catch {
                // ignore
            }
        }

        ttsSmoothedLevelRef.current = 0;
        setTtsLevel(0);
    };

    const startTtsMeter = async (audioEl) => {
        if (typeof window === "undefined") return;
        if (!audioEl) return;

        try {
            const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContextImpl();
            ttsAudioContextRef.current = ctx;

            if (ctx.state === "suspended") {
                try {
                    await ctx.resume();
                } catch {
                    // ignore
                }
            }

            const source = ctx.createMediaElementSource(audioEl);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.6;

            // Route: media -> analyser -> speakers
            source.connect(analyser);
            analyser.connect(ctx.destination);

            ttsSourceRef.current = source;
            ttsAnalyserRef.current = analyser;

            const data = new Uint8Array(analyser.fftSize);

            const tick = () => {
                if (!ttsAnalyserRef.current) return;
                ttsAnalyserRef.current.getByteTimeDomainData(data);

                let sumSquares = 0;
                for (let i = 0; i < data.length; i++) {
                    const v = (data[i] - 128) / 128;
                    sumSquares += v * v;
                }
                const rms = Math.sqrt(sumSquares / data.length);
                const boosted = Math.min(1, rms * 2.0);
                const prev = ttsSmoothedLevelRef.current;
                const next = prev * 0.86 + boosted * 0.14;
                ttsSmoothedLevelRef.current = next;
                setTtsLevel(next);

                ttsRafIdRef.current = requestAnimationFrame(tick);
            };

            ttsRafIdRef.current = requestAnimationFrame(tick);
        } catch (e) {
            console.warn("TTS meter unavailable:", e);
            stopTtsMeter();
        }
    };

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
                    <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-orange-400 to-amber-600" />
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
                <div className="relative">
                    <div className="h-16 w-16">
                        <VoiceSphere3D
                            className="h-full w-full"
                            level={isListening ? voiceLevel : isSpeaking ? ttsLevel : 0}
                        />
                    </div>

                    {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white/90 animate-spin" />
                        </div>
                    )}

                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-mono text-orange-400/80 uppercase tracking-widest">
                        {isProcessing ? "Processing" : isListening ? "Listening" : "Ready"}
                    </div>
                </div>
            </div>

            {/* User Interaction Area */}
            <div className="relative">
                <Card className={cn(
                    "bg-white/5 border-white/10 transition-all duration-300",
                    isListening ? "border-orange-500/30 bg-orange-500/5" : ""
                )}>
                    <CardContent className="p-6 min-h-37.5 flex flex-col justify-between">
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
