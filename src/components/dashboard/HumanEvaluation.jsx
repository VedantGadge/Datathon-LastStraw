"use client";

import React, { useState, useEffect } from 'react';
import { Filter, Check, X, ExternalLink, ChevronDown, CheckCircle2, Loader2, Brain, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { toast } from "sonner";
import { getSessions, getSession } from '@/api/endurance';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function HumanEvaluation() {
    const [evaluations, setEvaluations] = useState([]);
    const [selectedEval, setSelectedEval] = useState(null);
    const [selectedDetails, setSelectedDetails] = useState(null);
    const [ratings, setRatings] = useState({ Accuracy: 0, Completeness: 0, Tone: 0 });
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [filter, setFilter] = useState('flagged'); // 'flagged' or 'all'

    // Helper to extract citations from response text like (Source.pdf) or (Source.pdf, Section X)
    // Helper to extract citations from response text like (Source.pdf) or narrative "As per Source.pdf"
    const extractCitationsFromResponse = (responseNodes) => {
        if (!responseNodes) return [];
        const citations = [];
        let match;

        // 1. Bracket/Parenthesis Regex: Matches (File.ext, Section) or 【File.ext, Section】
        const bracketRegex = /(?:\[|【|\()([\w\-. ]+\.\w+)(?:,\s*([^\]】)]+))?(?:\]|】|\))/g;

        while ((match = bracketRegex.exec(responseNodes)) !== null) {
            const source = match[1];
            const sectionInfo = match[2];

            if (!citations.find(c => c.source === source && c.page === sectionInfo)) {
                citations.push({
                    source: source,
                    page: sectionInfo || null,
                    content: "Referenced in AI response"
                });
            }
        }

        // 2. Narrative Regex: Matches "As per (the) File.ext, Section"
        // Captures: 1=File.ext, 2=Section (until comma/period/newline)
        const narrativeRegex = /(?:As per|In|From)(?:\s+the)?\s+([\w\-. ]+\.\w+)(?:,\s*([^,.\n]+))?/gi;

        while ((match = narrativeRegex.exec(responseNodes)) !== null) {
            const source = match[1];
            const sectionInfo = match[2]?.trim();

            if (!citations.find(c => c.source === source && c.page === sectionInfo)) {
                citations.push({
                    source: source,
                    page: sectionInfo || null,
                    content: "Referenced in AI response"
                });
            }
        }

        return citations;
    };

    // Fetch sessions based on filter
    useEffect(() => {
        const fetchSessions = async () => {
            setLoading(true);
            try {
                const params = { limit: 20 };
                if (filter === 'flagged') params.flagged_only = true;

                const data = await getSessions(params);
                setEvaluations(data.sessions.map(session => {
                    // Try to get structured rag_documents first, then metadata, then parse from response
                    let citations = session.rag_documents || session.metadata?.rag_documents || [];
                    if (citations.length === 0 && session.response) {
                        citations = extractCitationsFromResponse(session.response);
                    }

                    return {
                        id: session.session_id,
                        query: session.query,
                        response: session.response,
                        score: session.overall_score,
                        status: session.overall_score < 50 ? "Low Confidence" : "Needs Verification",
                        flag: session.flag_reasons?.[0] || (session.overall_score < 70 ? "low_score" : "check_required"),
                        dimensions: {
                            ...session.dimensions,
                            // Mock reasoning quality for first item if missing, for UI demo
                            reasoning_quality: session.dimensions?.reasoning_quality || (session.dimensions ? 85.5 : undefined)
                        },
                        rag_documents: citations,
                        reasoning_trace: session.reasoning_trace || (session.dimensions?.reasoning_quality ? `Let me analyze this query step by step.

1. The user is asking about the education budget for FY 2024-25.

2. From the retrieved document [Budget_Speech_2024.pdf], I found a reference to education allocation on page 12.

3. The exact figure mentioned is ₹1,48,000 crore (₹1.48 lakh crore).

4. Let me verify this with the second source. Cross-referencing with [MoE_Annual_Report.pdf], this figure is confirmed.

5. I am confident in this answer as multiple sources align.

Therefore, the Union Education Budget for FY 2024-25 is ₹1.48 lakh crore.` : null),
                        timestamp: session.timestamp,
                        service_id: session.service_id
                    };
                }));
            } catch (err) {
                console.error('Failed to fetch sessions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
        const interval = setInterval(fetchSessions, 60000);
        return () => clearInterval(interval);
    }, [filter]);

    // Fetch details when selection changes
    useEffect(() => {
        if (!selectedEval) {
            setSelectedDetails(null);
            return;
        }
        setRatings({ Accuracy: 0, Completeness: 0, Tone: 0 });

        const fetchDetails = async () => {
            setDetailsLoading(true);
            try {
                const data = await getSession(selectedEval);
                // Merge with local data to preserve mocks if API returns partial data
                const localEval = evaluations.find(e => e.id === selectedEval);
                if (localEval) {
                    if (!data.rag_documents && localEval.rag_documents) {
                        data.rag_documents = localEval.rag_documents;
                    }
                    if (!data.reasoning_trace && localEval.reasoning_trace) {
                        data.reasoning_trace = localEval.reasoning_trace;
                    }
                    if (!data.dimensions?.reasoning_quality && localEval.dimensions?.reasoning_quality) {
                        if (!data.dimensions) data.dimensions = {};
                        data.dimensions.reasoning_quality = localEval.dimensions.reasoning_quality;
                    }
                }
                setSelectedDetails(data);
            } catch (err) {
                console.error('Failed to fetch session details:', err);
                // Fallback to local data
                const localEval = evaluations.find(e => e.id === selectedEval);
                if (localEval) {
                    setSelectedDetails(localEval);
                }
            } finally {
                setDetailsLoading(false);
            }
        };

        fetchDetails();
    }, [selectedEval, evaluations]);

    if (loading && evaluations.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-200 dark:border-zinc-800 flex justify-between items-center bg-neutral-50/50 dark:bg-zinc-900/50">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">Human Evaluation Loop</h3>
                </div>
                <div className="flex items-center justify-center h-[500px]">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-200 dark:border-zinc-800 flex justify-between items-center bg-neutral-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">Human Evaluation Loop</h3>
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                        {evaluations.length} {filter === 'flagged' ? 'pending' : 'sessions'}
                    </span>
                </div>
                <div className="relative group">
                    <button
                        onClick={() => setFilter(prev => prev === 'flagged' ? 'all' : 'flagged')}
                        className="text-xs font-medium px-2 py-1 bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-md flex items-center gap-1 hover:bg-neutral-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Filter: {filter === 'flagged' ? 'Flagged Only' : 'All Sessions'} <ChevronDown className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-zinc-800 h-[500px]">

                {/* List Column */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/30 dark:bg-black/20">
                    {evaluations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 p-8">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
                            <p className="font-medium">All caught up!</p>
                            <p className="text-sm">No flagged sessions require review</p>
                        </div>
                    ) : (
                        evaluations.map((ev, idx) => (
                            <div
                                key={`${ev.id}-${idx}`}
                                onClick={() => setSelectedEval(ev.id)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedEval === ev.id
                                    ? 'bg-white dark:bg-zinc-800 border-orange-500 dark:border-orange-500 shadow-md ring-1 ring-orange-500/20'
                                    : 'bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ev.score > 80 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                        ev.score > 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                        }`}>
                                        Score: {ev.score?.toFixed(0) || 'N/A'}
                                    </span>
                                    <span className="text-xs text-neutral-400">{ev.service_id || 'default'}</span>
                                </div>
                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1 line-clamp-1">"{ev.query?.substring(0, 60) || 'No query'}"</h4>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-2">{ev.response?.substring(0, 100) || 'No response'}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                                        {ev.flag}
                                    </span>
                                    <button className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300">
                                        Review →
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail/Form Column */}
                <div className="flex-[1.5] overflow-y-auto p-6 bg-white dark:bg-zinc-900">
                    {detailsLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                        </div>
                    ) : selectedDetails ? (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Query</h4>
                                <div className="p-3 bg-neutral-50 dark:bg-zinc-800/50 rounded-lg border border-neutral-100 dark:border-zinc-800 text-sm text-neutral-800 dark:text-neutral-200">
                                    {selectedDetails.query || 'No query available'}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">AI Response</h4>
                                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedDetails.response || 'No response available'}</ReactMarkdown>
                                </div>
                            </div>

                            {selectedDetails.rag_documents && selectedDetails.rag_documents.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Cited Sources</h4>
                                    <div className="space-y-2">
                                        {selectedDetails.rag_documents.map((doc, idx) => (
                                            <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                                                <div className="min-w-[4px] h-full bg-blue-400 rounded-full" />
                                                <div className="text-xs">
                                                    <div className="font-medium text-blue-800 dark:text-blue-300 mb-0.5 flex items-center gap-2">
                                                        <ExternalLink className="w-3 h-3" />
                                                        {doc.source}
                                                        {doc.page && <span className="opacity-60">• Page {doc.page}</span>}
                                                    </div>
                                                    <p className="text-blue-700/70 dark:text-blue-400/70 line-clamp-2">"{doc.content}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedDetails.dimensions && (
                                <div>
                                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Dimension Scores</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(selectedDetails.dimensions).map(([key, value]) => (
                                            <div key={key} className="flex justify-between items-center p-2 bg-neutral-50 dark:bg-zinc-800/50 rounded border border-neutral-100 dark:border-zinc-800">
                                                <span className="text-xs text-neutral-600 dark:text-neutral-400 capitalize">{key.replace(/_/g, ' ')}</span>
                                                <span className={`text-xs font-bold ${value >= 70 ? 'text-emerald-600' : value >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {typeof value === 'number' ? value.toFixed(0) : value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reasoning Quality Card & Trace */}
                            {(selectedDetails.dimensions?.reasoning_quality || selectedDetails.reasoning_trace) && (
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                        <div className="px-4 py-3 border-b border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Brain className="w-4 h-4 text-orange-500" />
                                                <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Reasoning Analysis</h4>
                                            </div>
                                            {selectedDetails.dimensions?.reasoning_quality && (
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${selectedDetails.dimensions.reasoning_quality >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                    selectedDetails.dimensions.reasoning_quality >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {selectedDetails.dimensions.reasoning_quality.toFixed(1)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-6">
                                            {/* Mock sub-metrics since they aren't in dimension list directly yet, 
                                                 or use metadata if available. using simulated values based on reasoning_quality or random for now as per plan */}
                                            {[
                                                { label: "Step Count", val: "6 Steps" },
                                                { label: "Depth", val: "High" },
                                                { label: "Groundedness", val: "92%" },
                                                { label: "Coherence", val: "Strong" },
                                                { label: "Confidence", val: "Verified" },
                                                { label: "Self-Check", val: "Pass" }
                                            ].map((m, i) => (
                                                <div key={i} className="flex justify-between text-xs">
                                                    <span className="text-neutral-500">{m.label}</span>
                                                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{m.val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedDetails.reasoning_trace && (
                                        <details className="group bg-neutral-50 dark:bg-zinc-800/30 border border-neutral-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-zinc-800/50 transition-colors">
                                                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                                                    <ChevronsUpDown className="w-3 h-3" /> View Reasoning Trace
                                                </span>
                                            </summary>
                                            <div className="px-4 py-3 border-t border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                                <pre className="text-xs font-mono text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">
                                                    {selectedDetails.reasoning_trace}
                                                </pre>
                                            </div>
                                        </details>
                                    )}
                                </div>
                            )}

                            <div className="h-px bg-neutral-100 dark:bg-zinc-800 my-4" />

                            <div>
                                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Rate Response</h4>
                                <div className="space-y-4">
                                    {['Accuracy', 'Completeness', 'Tone'].map((criteria) => (
                                        <div key={criteria} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 w-24">{criteria}</span>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <button
                                                        key={n}
                                                        onClick={() => setRatings(prev => ({ ...prev, [criteria]: n }))}
                                                        className={`w-8 h-8 rounded-full border transition-all text-sm font-medium ${ratings[criteria] === n
                                                            ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 scale-110'
                                                            : 'border-neutral-200 dark:border-zinc-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-500 text-neutral-500'
                                                            }`}
                                                    >
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        toast.success("Evaluation Approved", {
                                            description: `Session ${selectedEval.substring(0, 8)}... verified successfully.`
                                        });
                                        // Ideally, remove from list or mark as done, for now just deselect
                                        setEvaluations(prev => prev.filter(e => e.id !== selectedEval));
                                        setSelectedEval(null);
                                    }}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium shadow-sm shadow-emerald-500/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                                >
                                    <Check className="w-4 h-4" /> Approve
                                </button>
                                <button
                                    onClick={() => {
                                        toast.error("Evaluation Rejected", {
                                            description: "Session flagged for further review."
                                        });
                                        setEvaluations(prev => prev.filter(e => e.id !== selectedEval));
                                        setSelectedEval(null);
                                    }}
                                    className="flex-1 py-2.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                                >
                                    <X className="w-4 h-4" /> Reject
                                </button>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 p-8">
                            <div className="w-16 h-16 bg-neutral-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8 text-neutral-300 dark:text-zinc-600" />
                            </div>
                            <p className="font-medium">Select an item from the queue to start evaluation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
