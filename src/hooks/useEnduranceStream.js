/**
 * Real-time SSE hook for Endurance session updates
 */
"use client";

import { useEffect, useState, useCallback } from "react";

const API_BASE = "https://lamaq-endurance-backend-4-hods.hf.space";

/**
 * Hook for subscribing to real-time session updates via SSE
 * @param {boolean} flaggedOnly - Whether to only receive flagged sessions
 * @returns {{ sessions: Array, isConnected: boolean, error: Error|null }}
 */
export const useEnduranceStream = (flaggedOnly = false) => {
  const [sessions, setSessions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = `${API_BASE}/v1/stream?flagged_only=${flaggedOnly}`;
    let eventSource = null;

    try {
      eventSource = new EventSource(url);

      eventSource.addEventListener("open", () => {
        console.log("SSE Connected to Endurance API");
        setIsConnected(true);
        setError(null);
      });

      eventSource.addEventListener("init", (e) => {
        try {
          const initialSessions = JSON.parse(e.data);
          setSessions(initialSessions);
        } catch (err) {
          console.error("Failed to parse init data:", err);
        }
      });

      eventSource.addEventListener("session", (e) => {
        try {
          const newSession = JSON.parse(e.data);
          setSessions((prev) => [newSession, ...prev].slice(0, 100));
        } catch (err) {
          console.error("Failed to parse session data:", err);
        }
      });

      eventSource.addEventListener("error", (e) => {
        console.error("SSE Error:", e);
        setIsConnected(false);
        setError(new Error("SSE connection failed"));
      });
    } catch (err) {
      console.error("Failed to create EventSource:", err);
      setError(err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
        setIsConnected(false);
      }
    };
  }, [flaggedOnly]);

  const addSession = useCallback((session) => {
    setSessions((prev) => [session, ...prev].slice(0, 100));
  }, []);

  return { sessions, isConnected, error, addSession };
};

export default useEnduranceStream;
