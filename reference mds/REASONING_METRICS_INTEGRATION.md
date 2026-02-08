# Reasoning Metrics Integration Guide

**For:** Frontend Developers  
**Purpose:** Integrate GPT-OSS-120B reasoning trace evaluation into the UI  
**Last Updated:** February 5, 2026

---

## Overview

We've implemented a **10th dimension** called `reasoning_quality` that evaluates the chain-of-thought (CoT) reasoning trace from GPT-OSS-120B. This dimension is **optional** — it only appears when `reasoning_trace` is provided in the payload.

---

## Quick Summary

| Item | Value |
|------|-------|
| **New Dimension** | `reasoning_quality` |
| **Metrics Count** | 6 |
| **Trigger** | Only when `reasoning_trace` is in payload |
| **Model** | GPT-OSS-120B (via Groq) |
| **Toggle** | `enable_reasoning: true` on AWS /chat |

---

## Payload Changes

### Request to `/v1/evaluate`

**New Field:** `reasoning_trace` (optional string)

```json
{
  "query": "What is the education budget?",
  "response": "The education budget is ₹1.48 lakh crore.",
  "rag_documents": [...],
  "compliance_mode": "RTI",
  "reasoning_trace": "Let me analyze this step by step.\n\n1. The user is asking..."
}
```

### Response from `/v1/evaluate`

When `reasoning_trace` is provided, the response includes a new dimension:

```json
{
  "overall_score": 78.5,
  "dimensions": {
    "bias_fairness": 85.0,
    "data_grounding": 72.0,
    "explainability": 68.0,
    "ethical_alignment": 90.0,
    "human_control": 65.0,
    "legal_compliance": 82.0,
    "security": 95.0,
    "response_quality": 75.0,
    "environmental_cost": 80.0,
    "reasoning_quality": 79.2       // ← NEW (only when reasoning_trace provided)
  },
  "verification": {...},
  "flagged": false
}
```

---

## The 6 Reasoning Metrics

### Metric Details

| Metric | Score Range | What It Measures |
|--------|-------------|------------------|
| `reasoning_step_count` | 0-100 | Number of discrete reasoning steps (ideal: 3-10) |
| `reasoning_depth` | 0-100 | Reasoning effort relative to query complexity |
| `reasoning_groundedness` | 0-100 | Does reasoning cite source documents? |
| `reasoning_coherence` | 0-100 | Logical flow, absence of contradictions |
| `reasoning_confidence` | 0-100 | Low hedging/uncertainty language = high score |
| `reasoning_self_verification` | 0-100 | Does model verify its own claims? |

### Score Interpretation

| Score Range | Meaning | UI Suggestion |
|-------------|---------|---------------|
| **80-100** | Excellent reasoning | Green badge |
| **60-79** | Good reasoning | Yellow badge |
| **40-59** | Weak reasoning | Orange badge |
| **0-39** | Poor reasoning | Red badge |

---

## Frontend Integration Scenarios

### Scenario 1: Reasoning NOT Enabled

When the user has `enable_reasoning: false` in chat settings:

```json
// AWS /chat response
{
  "response": "The budget is...",
  "model_used": "llama-3.3-70b-versatile",
  "reasoning_trace": null  // ← Missing
}
```

```json
// Endurance /v1/evaluate response
{
  "dimensions": {
    "bias_fairness": 85.0,
    "data_grounding": 72.0,
    // ... 9 dimensions only
    // reasoning_quality NOT present
  }
}
```

**UI Behavior:**
- Show 9 dimensions in RAI breakdown
- Don't render reasoning_quality section
- Optionally show "Enable Reasoning for deeper analysis" prompt

---

### Scenario 2: Reasoning IS Enabled

When the user has `enable_reasoning: true`:

```json
// AWS /chat response
{
  "response": "The budget is...",
  "model_used": "gpt-oss-120b",
  "reasoning_trace": "Let me analyze this step by step..."  // ← Present
}
```

```json
// Endurance /v1/evaluate response
{
  "dimensions": {
    "bias_fairness": 85.0,
    "data_grounding": 72.0,
    // ... 9 dimensions
    "reasoning_quality": 79.2  // ← NEW 10th dimension
  }
}
```

**UI Behavior:**
- Show 10 dimensions in RAI breakdown
- Render reasoning_quality with its 6 sub-metrics
- Optionally show collapsible "View Reasoning Trace" with raw CoT

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AZURE CHAT UI                                  │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  [ ] Enable Reasoning Mode                                       │   │
│   │      Uses GPT-OSS-120B with chain-of-thought                    │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              │ User toggles ON                          │
│                              ▼                                           │
│   POST /chat                                                             │
│   {                                                                      │
│     "message": "What is the budget?",                                   │
│     "enable_reasoning": true,     ← TOGGLE                              │
│     "reasoning_effort": "medium"                                        │
│   }                                                                      │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AWS RAG SERVICE                                 │
│                                                                          │
│   if enable_reasoning:                                                   │
│       model = "gpt-oss-120b"                                            │
│       response, reasoning_trace = generate_with_reasoning()             │
│   else:                                                                  │
│       model = "llama-3.3-70b-versatile"                                 │
│       response = generate()                                              │
│       reasoning_trace = None                                             │
│                                                                          │
│   → Calls Endurance /v1/evaluate with reasoning_trace                   │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      ENDURANCE METRICS ENGINE                            │
│                                                                          │
│   if reasoning_trace:                                                    │
│       compute 10 dimensions (including reasoning_quality)               │
│   else:                                                                  │
│       compute 9 dimensions (no reasoning_quality)                       │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           AZURE CHAT UI                                  │
│                                                                          │
│   Response: "The budget is ₹1.48 lakh crore."                           │
│                                                                          │
│   ┌─────────────────────────────────────────────┐                       │
│   │  RAI Score: 78.5                            │                       │
│   │  ────────────────────────────               │                       │
│   │  ▼ Show Dimension Breakdown                 │                       │
│   │                                             │                       │
│   │  ├ Bias & Fairness      85 ████████░░       │                       │
│   │  ├ Data Grounding       72 ███████░░░       │                       │
│   │  ├ ...                                      │                       │
│   │  └ Reasoning Quality    79 ███████░░░  ← NEW│                       │
│   │                                             │                       │
│   │  ▼ View Reasoning Trace                     │                       │
│   │  ┌─────────────────────────────────────┐   │                       │
│   │  │ Let me analyze this step by step.   │   │                       │
│   │  │ 1. The user is asking about...      │   │                       │
│   │  │ 2. From the document, I found...    │   │                       │
│   │  └─────────────────────────────────────┘   │                       │
│   └─────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## TypeScript Interface

```typescript
interface EvaluateRequest {
  query: string;
  response: string;
  rag_documents: RAGDocument[];
  metadata?: Record<string, any>;
  compliance_mode?: 'RTI' | 'UK_GDPR' | 'EU_AI_ACT';
  preset?: string;
  reasoning_trace?: string;  // ← NEW (optional)
}

interface EvaluateResponse {
  session_id: string;
  service_id: string;
  overall_score: number;
  dimensions: {
    bias_fairness: number;
    data_grounding: number;
    explainability: number;
    ethical_alignment: number;
    human_control: number;
    legal_compliance: number;
    security: number;
    response_quality: number;
    environmental_cost: number;
    reasoning_quality?: number;  // ← NEW (only when reasoning_trace provided)
  };
  verification: {
    verified_claims: number;
    total_claims: number;
    hallucinated_claims: number;
  };
  flagged: boolean;
  flag_reasons: string[];
  timestamp: string;
}
```

---

## UI Component Suggestions

### 1. Reasoning Toggle

```jsx
<Switch
  label="Enable Reasoning Mode"
  description="Uses GPT-OSS-120B with chain-of-thought (slower, more transparent)"
  checked={enableReasoning}
  onChange={setEnableReasoning}
/>
```

### 2. Reasoning Quality Card

```jsx
{dimensions.reasoning_quality !== undefined && (
  <DimensionCard
    name="Reasoning Quality"
    score={dimensions.reasoning_quality}
    icon={<BrainIcon />}
    description="Evaluates the model's chain-of-thought process"
    expandable
  >
    <MetricRow label="Step Count" value={metrics.reasoning_step_count} />
    <MetricRow label="Depth" value={metrics.reasoning_depth} />
    <MetricRow label="Groundedness" value={metrics.reasoning_groundedness} />
    <MetricRow label="Coherence" value={metrics.reasoning_coherence} />
    <MetricRow label="Confidence" value={metrics.reasoning_confidence} />
    <MetricRow label="Self-Verification" value={metrics.reasoning_self_verification} />
  </DimensionCard>
)}
```

### 3. Reasoning Trace Viewer

```jsx
{reasoningTrace && (
  <Collapsible title="View Reasoning Trace">
    <CodeBlock language="markdown">
      {reasoningTrace}
    </CodeBlock>
  </Collapsible>
)}
```

---

## Metric Visualization Suggestions

### Reasoning Step Count

```
Steps: 6
[██████░░░░] Optimal (3-10 steps)
```

### Reasoning Depth

```
Depth: 59%
[██████░░░░] Appropriate for query complexity
```

### Groundedness

```
Groundedness: 80%
[████████░░] Cites 4/5 source documents
```

### Coherence

```
Coherence: 100%
[██████████] No contradictions, strong logical flow
```

### Confidence

```
Confidence: 95%
[█████████░] Low uncertainty language
```

### Self-Verification

```
Self-Verification: 60%
[██████░░░░] 2 verification statements found
```

---

## Example Reasoning Trace

Here's what a typical `reasoning_trace` looks like:

```
Let me analyze this query step by step.

1. The user is asking about the education budget for FY 2024-25.

2. From the retrieved document [Budget_Speech_2024.pdf], I found a 
   reference to education allocation on page 12.

3. The exact figure mentioned is ₹1,48,000 crore (₹1.48 lakh crore).

4. Let me verify this with the second source. Cross-referencing with 
   [MoE_Annual_Report.pdf], this figure is confirmed.

5. I am confident in this answer as multiple sources align.

Therefore, the Union Education Budget for FY 2024-25 is ₹1.48 lakh crore.
```

---

## Testing Checklist

- [ ] Test with `enable_reasoning: false` → Should show 9 dimensions
- [ ] Test with `enable_reasoning: true` → Should show 10 dimensions
- [ ] Test dimension breakdown UI includes reasoning_quality when present
- [ ] Test collapsible reasoning trace viewer
- [ ] Test toggle persists across sessions
- [ ] Test loading state while reasoning (takes longer)

---

## API Quick Test

```bash
# Test WITH reasoning trace
curl -X POST http://localhost:8000/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the budget?",
    "response": "The budget is 1.48 lakh crore.",
    "rag_documents": [{"content": "Budget is 1.48 lakh crore", "source": "doc.pdf"}],
    "reasoning_trace": "Let me analyze: 1. User asks about budget. 2. Document says 1.48 lakh crore. 3. Therefore, answer is confirmed."
  }'

# Response includes reasoning_quality dimension
```

```bash
# Test WITHOUT reasoning trace
curl -X POST http://localhost:8000/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the budget?",
    "response": "The budget is 1.48 lakh crore.",
    "rag_documents": [{"content": "Budget is 1.48 lakh crore", "source": "doc.pdf"}]
  }'

# Response does NOT include reasoning_quality dimension
```

---

## Questions?

Reach out to the backend team if you need:
- Sample reasoning traces for testing
- Mock API responses
- Clarification on metric interpretation

---

*Document for Frontend Integration — Endurance v2.0*
