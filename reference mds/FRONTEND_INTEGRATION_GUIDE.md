# Frontend Integration Guide
## Endurance RAI Monitoring API

**Production API**: `https://lamaq-endurance-backend-4-hods.hf.space`  
**API Docs**: https://lamaq-endurance-backend-4-hods.hf.space/docs

---

## Quick Start

### Install Dependencies
```bash
npm install axios
# or
yarn add axios
```

### API Client Setup (React/TypeScript)

```typescript
// src/api/endurance.ts
import axios from 'axios';

const API_BASE = 'https://lamaq-endurance-backend-4-hods.hf.space';

export const enduranceAPI = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface RAGDocument {
  source: string;
  content: string;
  id?: string;
  page?: number;
  similarity_score?: number;
}

export interface EvaluateRequest {
  query: string;
  response: string;
  service_id?: string;
  rag_documents: RAGDocument[];
  metadata?: Record<string, any>;
  custom_weights?: Record<string, number>;
}

export interface EvaluateResponse {
  session_id: string;
  service_id: string;
  overall_score: number;
  dimensions: Record<string, number>;
  verification: {
    total_claims: number;
    verified_claims: number;
    hallucinated_claims: number;
    verification_score: number;
  };
  flagged: boolean;
  flag_reasons: string[];
  timestamp: string;
}

export interface Session {
  session_id: string;
  service_id: string;
  query: string;
  response: string;
  overall_score: number;
  dimensions: Record<string, number>;
  flagged: boolean;
  timestamp: string;
}

export interface MetricsSummary {
  total_sessions: number;
  flagged_sessions: number;
  flagged_percentage: number;
  services_count: number;
  alert_threshold: number;
  connected: boolean;
}
```

---

## API Endpoints

### 1. Health Check
```typescript
// GET /health
const checkHealth = async () => {
  const response = await enduranceAPI.get('/health');
  return response.data; // { status: "ok", timestamp: "..." }
};
```

### 2. Evaluate Response
```typescript
// POST /v1/evaluate
const evaluateResponse = async (data: EvaluateRequest): Promise<EvaluateResponse> => {
  const response = await enduranceAPI.post('/v1/evaluate', data);
  return response.data;
};

// Example usage
const evaluation = await evaluateResponse({
  query: "What is the budget?",
  response: "The budget is 500 crore.",
  service_id: "rti_chatbot",
  rag_documents: [
    {
      source: "budget.pdf",
      content: "Total budget: 500 crore",
      page: 1,
      similarity_score: 0.95
    }
  ]
});

console.log(evaluation.overall_score); // 78.5
console.log(evaluation.flagged); // false
```

### 3. Get Sessions
```typescript
// GET /v1/sessions
const getSessions = async (params: {
  limit?: number;
  service_id?: string;
  flagged_only?: boolean;
}) => {
  const response = await enduranceAPI.get('/v1/sessions', { params });
  return response.data; // { sessions: [...], total: 50, source: "mongodb" }
};

// Get last 10 flagged sessions
const flagged = await getSessions({ limit: 10, flagged_only: true });
```

### 4. Get Session Details
```typescript
// GET /v1/sessions/{session_id}
const getSession = async (sessionId: string): Promise<Session> => {
  const response = await enduranceAPI.get(`/v1/sessions/${sessionId}`);
  return response.data;
};
```

### 5. Get Services
```typescript
// GET /v1/services
const getServices = async () => {
  const response = await enduranceAPI.get('/v1/services');
  return response.data; // { services: [...], source: "mongodb" }
};
```

### 6. Get Metrics Summary
```typescript
// GET /v1/metrics/summary
const getMetrics = async (): Promise<MetricsSummary> => {
  const response = await enduranceAPI.get('/v1/metrics/summary');
  return response.data;
};
```

---

## Real-Time Stream (SSE)

### React Hook Implementation

```typescript
// src/hooks/useEnduranceStream.ts
import { useEffect, useState } from 'react';

export const useEnduranceStream = (flaggedOnly = false) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const url = `https://lamaq-endurance-backend-4-hods.hf.space/v1/stream?flagged_only=${flaggedOnly}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener('open', () => {
      console.log('SSE Connected');
      setIsConnected(true);
    });

    eventSource.addEventListener('init', (e) => {
      const initialSessions = JSON.parse(e.data);
      setSessions(initialSessions);
    });

    eventSource.addEventListener('session', (e) => {
      const newSession = JSON.parse(e.data);
      setSessions(prev => [newSession, ...prev].slice(0, 100));
    });

    eventSource.addEventListener('error', (e) => {
      console.error('SSE Error:', e);
      setIsConnected(false);
    });

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [flaggedOnly]);

  return { sessions, isConnected };
};
```

### Usage in Component

```tsx
// src/components/LiveMonitor.tsx
import { useEnduranceStream } from '../hooks/useEnduranceStream';

export const LiveMonitor = () => {
  const { sessions, isConnected } = useEnduranceStream(true); // flagged only

  return (
    <div>
      <h2>Live Monitoring {isConnected && '🟢'}</h2>
      <div>
        {sessions.map(session => (
          <div key={session.session_id}>
            <h3>Score: {session.overall_score.toFixed(1)}</h3>
            <p>{session.query.substring(0, 100)}...</p>
            {session.flagged && <span className="badge-error">FLAGGED</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Dashboard Components Examples

### 1. Metrics Card

```tsx
// src/components/MetricsCard.tsx
import { useEffect, useState } from 'react';
import { getMetrics, MetricsSummary } from '../api/endurance';

export const MetricsCard = () => {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await getMetrics();
      setMetrics(data);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="card">
        <h3>Total Sessions</h3>
        <p className="text-3xl">{metrics.total_sessions}</p>
      </div>
      <div className="card">
        <h3>Flagged</h3>
        <p className="text-3xl text-red-500">{metrics.flagged_sessions}</p>
        <small>{metrics.flagged_percentage.toFixed(1)}%</small>
      </div>
      <div className="card">
        <h3>Services</h3>
        <p className="text-3xl">{metrics.services_count}</p>
      </div>
    </div>
  );
};
```

### 2. Session List

```tsx
// src/components/SessionList.tsx
import { useEffect, useState } from 'react';
import { getSessions, Session } from '../api/endurance';

export const SessionList = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const data = await getSessions({ limit: 50, flagged_only: flaggedOnly });
      setSessions(data.sessions);
    };
    fetch();
  }, [flaggedOnly]);

  return (
    <div>
      <div className="filters">
        <button onClick={() => setFlaggedOnly(!flaggedOnly)}>
          {flaggedOnly ? 'Show All' : 'Flagged Only'}
        </button>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Service</th>
            <th>Query</th>
            <th>Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.session_id}>
              <td>{new Date(session.timestamp).toLocaleTimeString()}</td>
              <td>{session.service_id}</td>
              <td>{session.query.substring(0, 50)}...</td>
              <td>{session.overall_score.toFixed(1)}</td>
              <td>
                {session.flagged ? (
                  <span className="badge-error">⚠️ FLAGGED</span>
                ) : (
                  <span className="badge-success">✓ OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Error Handling

```typescript
// src/api/endurance.ts (add interceptor)
enduranceAPI.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);
```

---

## Environment Variables

```bash
# .env
VITE_ENDURANCE_API_URL=https://lamaq-endurance-backend-4-hods.hf.space
```

```typescript
// src/config.ts
export const API_URL = import.meta.env.VITE_ENDURANCE_API_URL;
```

---

## Testing

```typescript
// Example unit test (Jest/Vitest)
import { evaluateResponse } from './api/endurance';

test('evaluateResponse returns valid data', async () => {
  const result = await evaluateResponse({
    query: "Test query",
    response: "Test response",
    service_id: "test",
    rag_documents: []
  });

  expect(result).toHaveProperty('session_id');
  expect(result).toHaveProperty('overall_score');
  expect(result.overall_score).toBeGreaterThanOrEqual(0);
  expect(result.overall_score).toBeLessThanOrEqual(100);
});
```

---

## CORS & Security

- ✅ CORS enabled for all origins (development)
- ✅ No authentication required (MVP)
- ⚠️ For production: Add API key authentication

---

## Support

- **API Docs**: https://lamaq-endurance-backend-4-hods.hf.space/docs
- **OpenAPI Spec**: https://lamaq-endurance-backend-4-hods.hf.space/openapi.json
- **MongoDB Dashboard**: https://cloud.mongodb.com (view persisted data)

---

**Status**: ✅ Production-ready  
**Tested**: 2026-02-04 23:25 IST  
**All endpoints verified and operational**
