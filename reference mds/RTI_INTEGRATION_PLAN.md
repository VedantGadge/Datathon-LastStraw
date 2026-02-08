# RTI Chatbot Integration Plan
## SDK vs Webhook Implementation

---

## Understanding the 500 Error

### What Happened
The PowerShell test got a 500 Internal Server Error, but the Python test passed. 

**Root Cause**: The API endpoint likely failed due to:
1. **Missing required fields** in RAGDocument structure
2. **Import errors** in the deployed environment (missing dependencies)
3. **Validation errors** in the Pydantic models

### Why Python Test Passed But PowerShell Failed
The Python test included ALL required fields:
```python
{
    "source": "...",
    "content": "...",
    "id": "doc1",           # ✅ Added
    "page": 1,              # ✅ Added  
    "similarity_score": 0.95 # ✅ Added
}
```

The PowerShell test was missing optional fields, which might have caused validation issues.

**Fix**: Always include all fields when testing. Check HF Space logs for exact error.

---

## Integration Approaches

### Approach 1: SDK Integration (Direct Library Call)
**What it is**: Import Endurance as a Python package in the RTI chatbot code.

**Architecture**:
```
┌─────────────────┐
│   RTI Chatbot   │
│   (AWS Lambda)  │
│                 │
│  import endurance
│  engine.evaluate()  ──────► Endurance Engine (HF Spaces)
│                 │           POST /v1/evaluate
└─────────────────┘
```

**Pros**:
- ✅ Type safety (Python types)
- ✅ Better error handling
- ✅ Can run locally without API calls
- ✅ Easier debugging

**Cons**:
- ❌ Requires Endurance package in RTI environment
- ❌ Needs to deploy code changes to RTI
- ❌ Both systems coupled

---

### Approach 2: Webhook Integration (HTTP POST)
**What it is**: RTI chatbot sends HTTP POST to Endurance API after generating response.

**Architecture**:
```
┌─────────────────┐
│   RTI Chatbot   │
│   (AWS Lambda)  │
│                 │
│  1. Generate    │
│     Response    │
│                 │
│  2. HTTP POST   │──────────► ┌────────────────────┐
│     to HF       │            │ Endurance Engine   │
│                 │            │ (HF Spaces)        │
│  3. Return to   │            │                    │
│     User        │            │ POST /v1/evaluate  │
│                 │            │                    │
│                 │◄───────────│ Returns scores     │
└─────────────────┘            └────────────────────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │  MongoDB    │
                                 │   Atlas     │
                                 └─────────────┘
```

**Pros**:
- ✅ Loosely coupled (RTI doesn't need Endurance code)
- ✅ Can run asynchronously (fire-and-forget)
- ✅ Easy to swap backends
- ✅ Works with any language/platform

**Cons**:
- ❌ Network latency (~500ms)
- ❌ Need to handle HTTP errors

---

## Recommended Approach: **Webhook (Async)**

### Why Webhook?
1. **RTI chatbot is already deployed** on AWS - we don't want to modify it heavily
2. **Loosely coupled** - Endurance can be updated independently
3. **Async evaluation** - Don't block user response with metrics calculation
4. **Platform agnostic** - Works even if RTI migrates to different tech stack

---

## Implementation: Webhook Integration

### Step 1: RTI Chatbot Modification

**Current RTI Flow**:
```python
# RTI chatbot (simplified)
@app.post("/chat")
async def chat(request):
    query = request.message
    
    # 1. Retrieve context (RAG)
    rag_docs = retriever.get_relevant_docs(query)
    
    # 2. Generate response (LLM)
    response = llm.generate(query, rag_docs)
    
    # 3. Return to user
    return {"response": response}
```

**Modified with Endurance** (Async):
```python
import httpx

ENDURANCE_URL = "https://lamaq-endurance-backend-4-hods.hf.space"

async def send_to_endurance(query, response, rag_docs):
    """Send evaluation request to Endurance (async, non-blocking)"""
    try:
        payload = {
            "query": query,
            "response": response,
            "service_id": "rti_chatbot",
            "rag_documents": [
                {
                    "source": doc.metadata.get("source", "unknown"),
                    "content": doc.page_content,
                    "id": doc.metadata.get("id", ""),
                    "page": doc.metadata.get("page", 0),
                    "similarity_score": doc.metadata.get("score", 0.0)
                }
                for doc in rag_docs
            ]
        }
        
        # Fire-and-forget (don't wait for response)
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(f"{ENDURANCE_URL}/v1/evaluate", json=payload)
            
    except Exception as e:
        # Don't let Endurance errors affect user response
        print(f"Endurance evaluation failed: {e}")

@app.post("/chat")
async def chat(request):
    query = request.message
    
    # 1. Retrieve context (RAG)
    rag_docs = retriever.get_relevant_docs(query)
    
    # 2. Generate response (LLM)
    response = llm.generate(query, rag_docs)
    
    # 3. Send to Endurance (async, non-blocking)
    asyncio.create_task(send_to_endurance(query, response, rag_docs))
    
    # 4. Return to user immediately
    return {"response": response}
```

**Key Features**:
- ✅ Non-blocking: User gets response immediately
- ✅ Error-safe: Endurance failures don't crash chatbot
- ✅ Minimal changes: Just 1 line added to main flow
- ✅ Async: `asyncio.create_task()` runs in background

---

### Step 2: RTI Chatbot Modification (Sync Alternative)

If you want **synchronous** evaluation (wait for scores before responding):

```python
@app.post("/chat")
async def chat(request):
    query = request.message
    
    # 1. Retrieve context (RAG)
    rag_docs = retriever.get_relevant_docs(query)
    
    # 2. Generate response (LLM)
    response = llm.generate(query, rag_docs)
    
    # 3. Evaluate with Endurance (blocking)
    evaluation = None
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            result = await client.post(
                f"{ENDURANCE_URL}/v1/evaluate",
                json={...}  # same payload as above
            )
            evaluation = result.json()
    except Exception as e:
        print(f"Evaluation failed: {e}")
    
    # 4. Return response + evaluation
    return {
        "response": response,
        "evaluation": evaluation,  # Include scores
        "flagged": evaluation.get("flagged") if evaluation else False
    }
```

**Use Case**: If you want to show "Verified ✓" badge to users in real-time.

---

## Integration Test Plan

### Test 1: Direct API Test
**Goal**: Verify Endurance accepts RTI chatbot format

```python
import requests

def test_rti_format():
    """Test with RTI chatbot's actual response format"""
    payload = {
        "query": "What is the RTI act?",
        "response": "The RTI Act 2005 gives citizens the right to access government information.",
        "service_id": "rti_chatbot",
        "rag_documents": [
            {
                "source": "RTI_Act_2005.pdf",
                "content": "Right to Information Act, 2005...",
                "id": "rti-doc-1",
                "page": 1,
                "similarity_score": 0.92
            }
        ]
    }
    
    response = requests.post(
        "https://lamaq-endurance-backend-4-hods.hf.space/v1/evaluate",
        json=payload
    )
    
    assert response.status_code == 200
    data = response.json()
    print(f"Score: {data['overall_score']}")
    print(f"Flagged: {data['flagged']}")
```

### Test 2: Mock RTI Chatbot Request
**Goal**: Simulate RTI chatbot calling Endurance

```python
async def test_rti_integration():
    """Simulate actual RTI chatbot flow"""
    # Simulate RTI chatbot generating response
    rti_query = "How to file RTI application?"
    rti_response = "To file RTI, submit Form A to PIO with Rs. 10 fee."
    rti_docs = [
        {
            "source": "RTI_Guidelines.pdf",
            "content": "Application process requires Form A submission...",
            "id": "guide-1",
            "page": 3,
            "similarity_score": 0.88
        }
    ]
    
    # Send to Endurance
    async with httpx.AsyncClient() as client:
        result = await client.post(
            "https://lamaq-endurance-backend-4-hods.hf.space/v1/evaluate",
            json={
                "query": rti_query,
                "response": rti_response,
                "service_id": "rti_chatbot",
                "rag_documents": rti_docs
            }
        )
    
    evaluation = result.json()
    
    # Verify it appears in MongoDB
    sessions = requests.get(
        "https://lamaq-endurance-backend-4-hods.hf.space/v1/sessions",
        params={"service_id": "rti_chatbot", "limit": 1}
    ).json()
    
    assert len(sessions["sessions"]) > 0
    assert sessions["sessions"][0]["query"] == rti_query
```

### Test 3: End-to-End with Real RTI Chatbot
**Goal**: Test with deployed RTI chatbot at AWS

**Steps**:
1. Update RTI chatbot code with webhook integration
2. Deploy to AWS
3. Send test query to RTI chatbot
4. Verify evaluation appears in MongoDB
5. Check metrics dashboard

---

## Next Steps

1. **Check HF Space Logs** - Find exact 500 error cause
2. **Run Test 1** - Verify Endurance accepts RTI format
3. **Decide**: Sync vs Async webhook
4. **Modify RTI Chatbot** - Add webhook call
5. **Deploy & Test** - End-to-end verification

---

## Webhook vs SDK Comparison

| Feature | Webhook (HTTP) | SDK (Library) |
|---------|--------------|--------------|
| Coupling | Loose | Tight |
| Latency | ~500ms | ~50ms |
| Error Impact | Isolated | Can crash RTI |
| Deployment | Independent | Requires RTI redeploy |
| Language | Any | Python only |
| **Recommendation** | ✅ **Use This** | For local dev only |
