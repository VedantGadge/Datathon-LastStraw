"use client";

import React, { useMemo, useState } from "react";
import { Users, Search, RefreshCcw, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ExpertFinderPanel() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("full");
  const [limit, setLimit] = useState(5);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const canSearch = useMemo(() => query.trim().length > 0 && !loading, [query, loading]);

  async function runSearch(e) {
    e?.preventDefault?.();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/experts/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          mode,
          limit: Number(limit) || 5,
        }),
      });

      const json = await res.json();
      if (!res.ok || json?.status === "error") {
        setData(null);
        setError(json?.report || "Failed to find experts");
        return;
      }

      setData(json);
    } catch (err) {
      setData(null);
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-neutral-200/60 dark:border-zinc-800/60 rounded-xl p-6 shadow-sm flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Expert Finder</h3>
            <p className="text-xs text-neutral-500">Find the best expert for a topic</p>
          </div>
        </div>
        <button
          onClick={runSearch}
          disabled={!canSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Searching..." : "Find Expert"}
        </button>
      </div>

      <form onSubmit={runSearch} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-1">
          <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Query</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Kubernetes scaling, React performance, ClickHouse"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          >
            <option value="full">full</option>
            <option value="fast">fast</option>
          </select>
        </div>

        <div className="space-y-1 md:col-span-1">
          <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Limit</label>
          <input
            type="number"
            min={1}
            max={20}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
        </div>
      </form>

      <div className="flex-1">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertCircle className="w-4 h-4" />
              Error
            </div>
            {error}
          </div>
        )}

        {!error && !data && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
            <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
            <p className="text-sm text-neutral-500">Enter a query to find the right expert.</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50/60 dark:bg-zinc-900/50 rounded-xl border border-neutral-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Mode:</span>
                <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-800">{data.mode}</span>
                <span className="ml-auto">Elapsed: {(data.elapsed_s ?? 0).toFixed(2)}s</span>
              </div>
              {data.report && (
                <div className="mt-3 prose prose-sm max-w-none dark:prose-invert prose-headings:mt-3 prose-p:my-2 prose-li:my-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.report}</ReactMarkdown>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Experts</h4>
              {Array.isArray(data.experts) && data.experts.length > 0 ? (
                data.experts.map((expert, idx) => {
                  const title =
                    expert?.name || expert?.full_name || expert?.id || `Expert ${idx + 1}`;

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-white dark:bg-zinc-800/50 border border-neutral-100 dark:border-zinc-800 rounded-xl shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {String(title)}
                          </p>
                          {expert?.title && (
                            <p className="text-xs text-neutral-500 mt-1">{String(expert.title)}</p>
                          )}
                        </div>
                        {expert?.score != null && (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[10px] font-medium border border-indigo-500/20">
                            Score: {String(expert.score)}
                          </span>
                        )}
                      </div>

                      {expert?.reason && (
                        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {String(expert.reason)}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 text-sm bg-neutral-50/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-neutral-200 dark:border-zinc-800">
                  No experts returned.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
