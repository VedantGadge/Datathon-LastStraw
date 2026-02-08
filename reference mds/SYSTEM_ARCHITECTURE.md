# Endurance RAI Platform — System Architecture

**Version:** 2.0 (Research-Grade)  
**Last Updated:** February 5, 2026  
**Authors:** TSEC Hacks Team

---

## Executive Summary

Endurance is a **Responsible AI (RAI) Assurance Platform** designed to evaluate and monitor AI-powered government services for compliance, trustworthiness, and ethical alignment. The system provides real-time evaluation of RAG-based chatbots against 10 ethical dimensions with 50+ granular metrics.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENDURANCE PLATFORM OVERVIEW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   USER                AWS RAG SERVICE              ENDURANCE ENGINE         │
│     │                      │                            │                   │
│     │   Query              │                            │                   │
│     ├─────────────────────►│                            │                   │
│     │                      │  Reasoning + Response      │                   │
│     │                      ├───────────────────────────►│                   │
│     │                      │                            │ 10 Dimensions     │
│     │                      │  ◄─────────────────────────┤ 50+ Metrics       │
│     │   Response + Score   │      Evaluation Scores     │                   │
│     │◄─────────────────────┤                            │                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [System Components](#1-system-components)
2. [AWS RAG Service](#2-aws-rag-service)
3. [Endurance Metrics Engine](#3-endurance-metrics-engine)
4. [API Layer](#4-api-layer)
5. [Data Flow](#5-data-flow)
6. [Dimensions & Metrics](#6-dimensions--metrics)
7. [Compliance Framework](#7-compliance-framework)
8. [Integration Points](#8-integration-points)
9. [Security Architecture](#9-security-architecture)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. System Components

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                    PRESENTATION LAYER                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                   │
│  │   Azure WebApp  │    │  Streamlit UI   │    │   Admin Panel   │                   │
│  │   (Chat UI)     │    │  (Dashboard)    │    │   (Monitoring)  │                   │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘                   │
└───────────┼────────────────────────────────────────────────────────────────────────────
            │                      │                      │
            ▼                      ▼                      ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                    SERVICE LAYER                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        AWS RAG SERVICE (Lambda + API Gateway)                   │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐ │  │
│  │  │   /chat     │   │  /session   │   │  /feedback  │   │  Vector Store       │ │  │
│  │  │   endpoint  │   │  management │   │  collection │   │  (Pinecone/FAISS)   │ │  │
│  │  └──────┬──────┘   └─────────────┘   └─────────────┘   └─────────────────────┘ │  │
│  └─────────┼──────────────────────────────────────────────────────────────────────┘  │
│            │                                                                          │
│            ▼                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                    ENDURANCE METRICS ENGINE (FastAPI)                           │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────┐  │  │
│  │  │ /evaluate │  │ /presets  │  │ /stream   │  │ /sessions │  │ /compliance  │  │  │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └──────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA LAYER                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                   │
│  │    MongoDB      │    │   Redis Cache   │    │  OpenAI API     │                   │
│  │  (Persistence)  │    │  (Sessions)     │    │  (Embeddings)   │                   │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘                   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| **Azure WebApp** | React/Next.js | Chat interface for citizens |
| **AWS RAG Service** | Lambda + API Gateway | Document retrieval, LLM inference, reasoning |
| **Endurance Engine** | FastAPI (Python) | RAI evaluation, compliance checking, scoring |
| **Vector Store** | Pinecone/FAISS | Document embeddings for semantic search |
| **MongoDB** | MongoDB Atlas | Persistent session and evaluation storage |
| **OpenAI API** | text-embedding-3-small | Deterministic semantic similarity |

---

## 2. AWS RAG Service

### Service Details

| Property | Value |
|----------|-------|
| **Base URL** | `https://onehhynrll.execute-api.ap-south-1.amazonaws.com/prod` |
| **Region** | ap-south-1 (Mumbai) |
| **Runtime** | AWS Lambda (Python 3.11) |
| **API Gateway** | REST API with CORS enabled |

### Endpoints

#### POST `/chat`

Primary endpoint for conversational RAG.

**Request Schema:**
```json
{
  "message": "What is the education budget for 2024-25?",
  "session_id": "uuid-v4-string",
  "include_evaluation": true,
  "enable_reasoning": true,
  "reasoning_effort": "medium"
}
```

**Response Schema:**
```json
{
  "response": "The education budget for FY 2024-25 is ₹1.48 lakh crore...",
  "session_id": "uuid-v4-string",
  "model_used": "gpt-oss-120b",
  "reasoning_trace": "Let me analyze this step by step...",
  "sources": [
    {
      "document": "Budget_Speech_2024.pdf",
      "page": 12,
      "relevance_score": 0.92
    }
  ],
  "evaluation": {
    "overall_score": 78.5,
    "dimensions": {...}
  }
}
```

### Model Selection Logic

```python
if enable_reasoning:
    model = "gpt-oss-120b"  # Via Groq API
    # Returns: reasoning_trace + response
else:
    model = "llama-3.3-70b-versatile"  # Via Groq API
    # Returns: response only
```

### Reasoning Effort Levels

| Level | Description | Token Budget |
|-------|-------------|--------------|
| `low` | Quick reasoning, minimal steps | ~500 tokens |
| `medium` | Balanced depth and speed | ~1000 tokens |
| `high` | Deep analysis, thorough verification | ~2000 tokens |

---

## 3. Endurance Metrics Engine

### Core Architecture

```
endurance/
├── metrics/
│   ├── __init__.py              # MetricsEngine, compute_all_metrics()
│   ├── normalizer.py            # Score normalization (0-100)
│   ├── aggregator.py            # Weighted dimension aggregation
│   └── dimensions/
│       ├── bias_fairness.py     # Dimension 1
│       ├── data_grounding.py    # Dimension 2
│       ├── explainability.py    # Dimension 3
│       ├── ethical_alignment.py # Dimension 4
│       ├── human_control.py     # Dimension 5
│       ├── legal_compliance.py  # Dimension 6
│       ├── security.py          # Dimension 7
│       ├── response_quality.py  # Dimension 8
│       ├── environmental_cost.py# Dimension 9
│       └── reasoning_quality.py # Dimension 10 (NEW)
├── verification/
│   └── pipeline.py              # Claim verification pipeline
├── config/
│   └── presets.py               # Compliance presets (RTI, UK, EU)
└── storage/
    └── mongo.py                 # MongoDB integration
```

### MetricsEngine Class

```python
class MetricsEngine:
    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or DEFAULT_WEIGHTS
    
    def evaluate(
        self,
        query: str,
        response: str,
        rag_documents: List[Any],
        metadata: Optional[Dict[str, Any]] = None,
        compliance_mode: str = "RTI",
        reasoning_trace: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Evaluate a query-response pair across all dimensions.
        
        Returns:
            {
                "overall_score": 78.5,
                "dimensions": {"bias_fairness": 85.0, ...},
                "verified_claims": 5,
                "total_claims": 6,
                "hallucinated_claims": 1
            }
        """
```

### Evaluation Pipeline

```
Input: (query, response, rag_documents, reasoning_trace)
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    DIMENSION COMPUTATION                      │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Bias &      │  │ Data        │  │ Explain-    │           │
│  │ Fairness    │  │ Grounding   │  │ ability     │           │
│  │ (5 metrics) │  │ (6 metrics) │  │ (4 metrics) │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Ethical     │  │ Human       │  │ Legal       │           │
│  │ Alignment   │  │ Control     │  │ Compliance  │           │
│  │ (5 metrics) │  │ (4 metrics) │  │ (8 metrics) │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Security    │  │ Response    │  │ Environment │           │
│  │             │  │ Quality     │  │ & Cost      │           │
│  │ (5 metrics) │  │ (6 metrics) │  │ (3 metrics) │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                               │
│  ┌─────────────────────────────────────────────────┐         │
│  │         Reasoning Quality (OPTIONAL)             │         │
│  │  step_count | depth | groundedness | coherence   │         │
│  │  confidence | self_verification                  │         │
│  │  (6 metrics - only when reasoning_trace exists) │         │
│  └─────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    WEIGHTED AGGREGATION                       │
│                                                               │
│  overall_score = Σ(dimension_score × weight) / Σ(weights)    │
│                                                               │
│  Default Weights:                                             │
│  ├── bias_fairness:     0.12                                 │
│  ├── data_grounding:    0.15                                 │
│  ├── explainability:    0.10                                 │
│  ├── ethical_alignment: 0.10                                 │
│  ├── human_control:     0.08                                 │
│  ├── legal_compliance:  0.15                                 │
│  ├── security:          0.10                                 │
│  ├── response_quality:  0.12                                 │
│  ├── environmental_cost:0.08                                 │
│  └── reasoning_quality: 0.10 (when available)                │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
       Output: EvaluationResult
```

---

## 4. API Layer

### Endurance API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check, system status |
| `GET` | `/health` | Simple health probe |
| `POST` | `/v1/evaluate` | Full RAI evaluation |
| `GET` | `/v1/presets` | List available compliance presets |
| `GET` | `/v1/compliance-modes` | List valid compliance modes |
| `GET` | `/v1/sessions/{id}` | Get session history |
| `POST` | `/v1/batch` | Batch evaluation |
| `GET` | `/v1/stream` | SSE stream for real-time updates |

### `/v1/evaluate` — Full Specification

**Request:**
```json
{
  "session_id": "optional-uuid",
  "service_id": "default",
  "query": "What documents do I need for passport renewal?",
  "response": "For passport renewal, you need...",
  "rag_documents": [
    {
      "id": "doc-001",
      "source": "passport_guidelines.pdf",
      "content": "The required documents for renewal include...",
      "page": 5,
      "similarity_score": 0.89
    }
  ],
  "metadata": {
    "tokens_used": 1250,
    "latency_ms": 450,
    "model": "gpt-oss-120b"
  },
  "compliance_mode": "RTI",
  "preset": null,
  "reasoning_trace": "Let me analyze this step by step..."
}
```

**Response:**
```json
{
  "session_id": "uuid-generated",
  "service_id": "default",
  "overall_score": 82.5,
  "dimensions": {
    "bias_fairness": 88.0,
    "data_grounding": 75.0,
    "explainability": 72.0,
    "ethical_alignment": 90.0,
    "human_control": 65.0,
    "legal_compliance": 85.0,
    "security": 95.0,
    "response_quality": 78.0,
    "environmental_cost": 80.0,
    "reasoning_quality": 79.2
  },
  "verification": {
    "verified_claims": 4,
    "total_claims": 5,
    "hallucinated_claims": 1,
    "source_coverage": 0.85
  },
  "flagged": false,
  "flag_reasons": [],
  "reasoning": [
    {
      "dimension": "human_control",
      "score": 65.0,
      "explanation": "Missing appeal information"
    }
  ],
  "timestamp": "2026-02-05T08:00:00Z"
}
```

---

## 5. Data Flow

### Complete Request Lifecycle

```
┌─────────┐                                                                    
│ Citizen │                                                                    
└────┬────┘                                                                    
     │ 1. "What is the education budget?"                                      
     ▼                                                                         
┌────────────────────────────────────────────────────────────────────────────┐
│                          AZURE WEB APP                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Chat Interface                                                       │  │
│  │  - Session management                                                 │  │
│  │  - UI rendering                                                       │  │
│  │  - enable_reasoning toggle                                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────┬───────────────────────────────────────────────────────────────────────┘
     │ 2. POST /chat {message, enable_reasoning: true}                        
     ▼                                                                         
┌────────────────────────────────────────────────────────────────────────────┐
│                          AWS RAG SERVICE                                    │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ 3. Vector    │    │ 4. LLM       │    │ 5. Reasoning │                  │
│  │    Search    │───►│    Inference │───►│    Extract   │                  │
│  │  (Pinecone)  │    │ (GPT-OSS-120B)│   │              │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                           │
│         │ Retrieved Docs    │ Response          │ Reasoning Trace           │
│         ▼                   ▼                   ▼                           │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    TELEMETRY AGGREGATION                            │    │
│  │  {query, response, rag_documents, reasoning_trace, metadata}        │    │
│  └─────────────────────────────┬──────────────────────────────────────┘    │
└────────────────────────────────┼───────────────────────────────────────────┘
                                 │ 6. POST /v1/evaluate                       
                                 ▼                                            
┌────────────────────────────────────────────────────────────────────────────┐
│                       ENDURANCE METRICS ENGINE                              │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  7. DIMENSION COMPUTATION                                             │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │ For each dimension in [bias, grounding, explainability, ...]:   │ │  │
│  │  │   metrics = dimension.compute(query, response, docs, metadata)   │ │  │
│  │  │   dimension_score = mean(metric.normalized_score for each)       │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │ If reasoning_trace provided:                                     │ │  │
│  │  │   reasoning_metrics = reasoning_quality.compute(...)             │ │  │
│  │  │   Add "reasoning_quality" dimension                              │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  8. AGGREGATION & FLAGS                                               │  │
│  │                                                                       │  │
│  │  overall_score = weighted_mean(dimension_scores)                      │  │
│  │  flagged = check_thresholds(overall_score, dimensions)                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  9. PERSISTENCE                                                       │  │
│  │                                                                       │  │
│  │  MongoDB.store(session_id, evaluation_result)                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬───────────────────────────────────────────┘
                                 │ 10. Return EvaluationResult                
                                 ▼                                            
┌────────────────────────────────────────────────────────────────────────────┐
│                          AWS RAG SERVICE                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  11. Merge response + evaluation                                      │  │
│  │      Return to Azure WebApp                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬───────────────────────────────────────────┘
                                 │                                            
                                 ▼                                            
┌────────────────────────────────────────────────────────────────────────────┐
│                          AZURE WEB APP                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  12. Render response with RAI score badge                             │  │
│  │      Display dimension breakdown on hover/click                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬───────────────────────────────────────────┘
                                 │                                            
                                 ▼                                            
                           ┌─────────┐                                        
                           │ Citizen │ Sees: Response + Trust Score           
                           └─────────┘                                        
```

---

## 6. Dimensions & Metrics

### Dimension Overview

| # | Dimension | Metrics | Weight | Key Focus |
|---|-----------|---------|--------|-----------|
| 1 | **Bias & Fairness** | 5 | 0.12 | Stereotypes, sentiment neutrality |
| 2 | **Data Grounding** | 6 | 0.15 | Source attribution, hallucination detection |
| 3 | **Explainability** | 4 | 0.10 | Citations, clarity, reasoning transparency |
| 4 | **Ethical Alignment** | 5 | 0.10 | Professional norms, sensitivity |
| 5 | **Human Control** | 4 | 0.08 | Escalation paths, appeal information |
| 6 | **Legal Compliance** | 8 | 0.15 | RTI/GDPR/EU AI Act adherence |
| 7 | **Security** | 5 | 0.10 | Prompt injection, data leakage |
| 8 | **Response Quality** | 6 | 0.12 | Accuracy, completeness, relevance |
| 9 | **Environmental Cost** | 3 | 0.08 | Token efficiency, carbon footprint |
| 10 | **Reasoning Quality** | 6 | 0.10 | CoT coherence, groundedness, verification |

### Detailed Metric Breakdown

#### Dimension 1: Bias & Fairness
```
├── stereotype_score        # Presence of stereotypical language
├── sentiment_neutrality    # Emotional balance of response
├── demographic_parity      # Equal treatment across groups
├── protected_class_check   # Sensitive attribute handling
└── language_inclusivity    # Inclusive terminology usage
```

#### Dimension 2: Data Grounding
```
├── source_attribution      # Claims linked to sources
├── semantic_similarity     # Response-document similarity (OpenAI embeddings)
├── coverage_score          # % of documents used
├── hallucination_rate      # Unsupported claims detected
├── contradiction_check     # Internal consistency
└── recency_relevance       # Source freshness
```

#### Dimension 3: Explainability
```
├── citation_density        # Sources per claim
├── reasoning_transparency  # Explicit logic shown
├── jargon_score           # Accessibility of language
└── structure_clarity       # Logical organization
```

#### Dimension 4: Ethical Alignment
```
├── professional_tone       # Government-appropriate language
├── sensitivity_check       # Handling of sensitive topics
├── consent_awareness       # Data usage transparency
├── harm_avoidance         # Potentially harmful content
└── cultural_sensitivity    # Regional appropriateness
```

#### Dimension 5: Human Control
```
├── escalation_info        # Human contact provided
├── appeal_mechanism       # Appeal process mentioned
├── limitation_disclosure  # AI limitations stated
└── override_availability  # Human override options
```

#### Dimension 6: Legal Compliance
```
├── section_4_proactive    # Proactive disclosure (RTI)
├── section_7_format       # Response format compliance
├── section_8_exemptions   # Exemption handling (CRITICAL)
├── timeline_compliance    # 30-day response timeline
├── authority_reference    # Proper authority citation
├── uk_foi_compliance      # UK FOI Act (if UK_GDPR mode)
├── eu_high_risk_check     # EU AI Act high-risk systems
└── gdpr_article_22        # Automated decision disclosure
```

#### Dimension 7: Security
```
├── prompt_injection_score  # Attack pattern detection
├── data_leakage_risk      # PII exposure check
├── jailbreak_resistance    # Bypass attempt detection
├── input_sanitization     # Malicious input handling
└── output_safety          # Safe content generation
```

#### Dimension 8: Response Quality
```
├── accuracy_score         # Factual correctness
├── completeness_score     # Query coverage
├── relevance_score        # Topic alignment
├── f1_score              # Precision-recall balance
├── fluency_score         # Grammatical quality
└── confidence_level       # Hedging density (linguistic uncertainty)
```

#### Dimension 9: Environmental Cost
```
├── token_efficiency       # Tokens per info unit
├── latency_score         # Response time
└── carbon_estimate       # CO2 equivalent estimate
```

#### Dimension 10: Reasoning Quality (NEW)
```
├── reasoning_step_count        # Discrete reasoning steps
├── reasoning_depth            # Effort vs query complexity
├── reasoning_groundedness     # Source citations in trace
├── reasoning_coherence        # Logical flow
├── reasoning_confidence       # Uncertainty markers
└── reasoning_self_verification # Self-checking behavior
```

---

## 7. Compliance Framework

### Supported Compliance Modes

| Mode | Jurisdiction | Key Regulations |
|------|--------------|-----------------|
| `RTI` | India | Right to Information Act 2005 |
| `UK_GDPR` | United Kingdom | UK GDPR + FOI Act 2000 |
| `EU_AI_ACT` | European Union | EU AI Act (high-risk systems) |

### Presets

| Preset | Mode | Description |
|--------|------|-------------|
| `standard_rti` | RTI | Default Indian government |
| `defense_ministry` | RTI | High security weighting |
| `public_grievance` | RTI | Human control emphasis |
| `uk_govt_standard` | UK_GDPR | UK government alignment |
| `uk_high_security` | UK_GDPR | Enhanced security weighting |
| `eu_strict_compliance` | EU_AI_ACT | Full EU AI Act compliance |
| `eu_critical_infrastructure` | EU_AI_ACT | Critical systems weighting |

### RTI Section 8 — Hard Constraint

```python
# Section 8 violations force entire legal_compliance dimension to 0

SECTION_8_EXEMPTIONS = [
    "sovereignty_security",      # 8(1)(a)
    "cabinet_papers",           # 8(1)(i)
    "trade_secrets",            # 8(1)(d)
    "privacy",                  # 8(1)(j)
    ...
]

if section_8_violated:
    legal_compliance_score = 0  # Automatic failure
```

---

## 8. Integration Points

### AWS → Endurance

```python
# In AWS Lambda handler
import httpx

async def evaluate_response(query, response, docs, reasoning_trace):
    async with httpx.AsyncClient() as client:
        result = await client.post(
            "https://endurance-api.example.com/v1/evaluate",
            json={
                "query": query,
                "response": response,
                "rag_documents": docs,
                "reasoning_trace": reasoning_trace,
                "compliance_mode": "RTI",
            },
            timeout=30.0,
        )
    return result.json()
```

### Endurance → MongoDB

```python
# Session persistence
class MongoEngine:
    def store_evaluation(self, session_id: str, result: EvaluationResult):
        self.db.evaluations.insert_one({
            "session_id": session_id,
            "timestamp": datetime.now(),
            "overall_score": result.overall_score,
            "dimensions": result.dimensions,
            "flagged": result.flagged,
        })
```

### Endurance → OpenAI (Embeddings)

```python
# Deterministic semantic similarity (NOT LLM-as-Judge)
from openai import OpenAI

client = OpenAI()

def get_embedding(text: str) -> List[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding

def cosine_similarity(a: List[float], b: List[float]) -> float:
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

---

## 9. Security Architecture

### API Security

```
┌────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. TRANSPORT SECURITY                                         │
│     └── TLS 1.3 encryption on all endpoints                   │
│                                                                │
│  2. AUTHENTICATION                                             │
│     ├── API Key validation (X-API-Key header)                 │
│     └── JWT tokens for session management                      │
│                                                                │
│  3. RATE LIMITING                                              │
│     ├── 100 req/min per API key                               │
│     └── 1000 req/day per free tier                            │
│                                                                │
│  4. INPUT VALIDATION                                           │
│     ├── Pydantic schema validation                             │
│     ├── Query length limits (10,000 chars)                    │
│     └── Document size limits (100KB each)                      │
│                                                                │
│  5. OUTPUT SANITIZATION                                        │
│     ├── PII detection and masking                              │
│     └── Sensitive data filtering                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Prompt Injection Detection

```python
INJECTION_PATTERNS = [
    r"ignore (all |previous |above )?instructions",
    r"disregard (all |previous |above )?instructions",
    r"you are now",
    r"pretend (to be|you are)",
    r"system:\s*",
    r"<\|system\|>",
    r"\[INST\]",
    ...
]

def detect_injection(query: str) -> float:
    """Returns injection risk score 0.0-1.0"""
    matches = sum(1 for p in INJECTION_PATTERNS if re.search(p, query, re.I))
    return min(matches / 3, 1.0)
```

---

## 10. Deployment Architecture

### Production Topology

```
                        ┌─────────────────┐
                        │   CloudFlare    │
                        │   (CDN + WAF)   │
                        └────────┬────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
        ┌─────────────────┐            ┌─────────────────┐
        │  Azure WebApp   │            │   AWS API GW    │
        │  (Frontend)     │            │   (RAG API)     │
        │  West India     │            │   ap-south-1    │
        └────────┬────────┘            └────────┬────────┘
                 │                               │
                 │                               ▼
                 │                      ┌─────────────────┐
                 │                      │   AWS Lambda    │
                 │                      │ (RAG Service)   │
                 │                      └────────┬────────┘
                 │                               │
                 │                               │
                 └───────────────┬───────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Endurance     │
                        │   (FastAPI)     │
                        │   Render.com    │
                        └────────┬────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
        ┌─────────────────┐            ┌─────────────────┐
        │   MongoDB       │            │   OpenAI API    │
        │   Atlas         │            │   (Embeddings)  │
        └─────────────────┘            └─────────────────┘
```

### Environment Variables

```bash
# Endurance Engine
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb+srv://...
GROQ_API_KEY=gsk_...

# AWS RAG Service
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
AWS_RAG_ENDPOINT=https://...

# Feature Flags
ENABLE_REASONING_METRICS=true
DEFAULT_COMPLIANCE_MODE=RTI
```

---

## Appendix A: Research Basis

| Feature | Research Paper | Year |
|---------|----------------|------|
| Reasoning Step Evaluation | Scheherazade (arXiv) | 2025 |
| CoT Verification | REVEAL (Google, ACL) | 2024 |
| Reasoning Monitorability | OpenAI Safety Research | 2025 |
| Linguistic Uncertainty | LVU Framework | 2024 |
| Hallucination Detection | HaluEval Benchmark | 2023 |

---

## Appendix B: Metric Calculation Methods

| Method | Usage | LLM-Free? |
|--------|-------|-----------|
| Regex pattern matching | Injection, hedging, citations | ✅ Yes |
| OpenAI Embeddings | Semantic similarity | ✅ Deterministic |
| Levenshtein distance | Text overlap | ✅ Yes |
| Statistical analysis | Token counts, ratios | ✅ Yes |
| NLTK/spaCy | POS tagging, NER | ✅ Yes |

**Note:** The system intentionally avoids LLM-as-Judge patterns to ensure deterministic, auditable, and reproducible results.

---

## Appendix C: API Quick Reference

```bash
# Health Check
curl https://endurance-api.example.com/

# List Presets
curl https://endurance-api.example.com/v1/presets

# Evaluate (RTI Mode)
curl -X POST https://endurance-api.example.com/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the budget?",
    "response": "The budget is 1.48 lakh crore.",
    "rag_documents": [{"content": "Budget is 1.48 lakh crore", "source": "budget.pdf"}],
    "compliance_mode": "RTI"
  }'

# Evaluate with Reasoning
curl -X POST https://endurance-api.example.com/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the budget?",
    "response": "The budget is 1.48 lakh crore.",
    "reasoning_trace": "Let me analyze step by step...",
    "compliance_mode": "RTI"
  }'
```

---

*Document generated by Endurance Platform v2.0*
