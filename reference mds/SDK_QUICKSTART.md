# Endurance SDK - Quick Start Guide

## ✅ SDK Successfully Installed!

The Endurance Python SDK is now installed and ready to use.

## Installation

The SDK has been installed in **editable mode** from the local `endurance-sdk` directory:

```bash
cd endurance-sdk
pip install -e .
```

This allows you to import and use the SDK anywhere in your project:

```python
from endurance import EnduranceClient, RAGDocument
```

---

## Quick Usage

### 1. Basic Evaluation

```python
import asyncio
from endurance import EnduranceClient, RAGDocument

async def main():
    # Initialize client
    client = EnduranceClient()
    
    # Prepare documents
    docs = [
        RAGDocument(
            source="FOI_Act_2000.pdf",
            content="Public authorities must respond within 20 working days.",
            similarity_score=0.95
        )
    ]
    
    # Evaluate
    result = await client.evaluate(
        query="How long for FOI response?",
        response="Public authorities must respond within 20 working days.",
        service_id="demo_chatbot",
        rag_documents=docs
    )
    
    print(f"Score: {result.overall_score}/100")
    print(f"Flagged: {result.flagged}")

asyncio.run(main())
```

---

## Running the Examples

Test the SDK with the included examples:

```bash
cd endurance-sdk
python examples.py
```

This will run 3 examples:
1. **Good Response** - High RAI score (90+)
2. **Bad Response** - Low score, flagged for hallucination
3. **Service Stats** - Fetch aggregate metrics

---

## Key Features

### ✅ What Works

- **Async/await support** - Non-blocking evaluations
- **Automatic retries** - Exponential backoff
- **Type hints** - Full IDE autocomplete
- **Error handling** - Custom exceptions
- **9 RAI dimensions** - Comprehensive evaluation

### 📋 Available Methods

#### `evaluate()`
Evaluate chatbot response for RAI compliance.

**Parameters:**
- `query` (str): User's question
- `response` (str): Chatbot's answer
- `service_id` (str): Service identifier
- `rag_documents` (List[RAGDocument]): Retrieved documents
- `metadata` (dict, optional): Additional context

**Returns:** `EvaluationResult` with scores and flagging status

---

#### `health_check()`
Check if Endurance backend is available.

**Returns:** Health status dictionary

---

#### `get_service_stats(service_id)`
Get aggregate statistics for a service.

**Parameters:**
- `service_id` (str): Service identifier

**Returns:** Statistics dictionary

---

## Integration with Your Chatbot

### Fire-and-Forget Pattern (Recommended)

```python
from endurance import EnduranceClient
import asyncio

client = EnduranceClient()

def chatbot_handler(user_query, bot_response, rag_docs):
    # Return response immediately
    send_to_user(bot_response)
    
    # Evaluate in background (non-blocking)
    asyncio.create_task(
        client.evaluate(
            query=user_query,
            response=bot_response,
            service_id="uk_gov_chatbot",
            rag_documents=rag_docs
        )
    )
```

---

### Synchronous Wrapper (If Needed)

```python
import asyncio
from endurance import EnduranceClient

client = EnduranceClient()

def evaluate_sync(query, response, rag_docs):
    """Synchronous wrapper for async evaluate()"""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(
        client.evaluate(
            query=query,
            response=response,
            service_id="demo",
            rag_documents=rag_docs
        )
    )
```

---

## Error Handling

```python
from endurance import (
    EnduranceClient,
    EnduranceError,
    RateLimitError,
    TimeoutError
)

client = EnduranceClient()

try:
    result = await client.evaluate(...)
    
except RateLimitError:
    print("Rate limit exceeded - try again later")
    
except TimeoutError as e:
    print(f"Request timed out after {e.timeout_seconds}s")
    
except EnduranceError as e:
    print(f"Endurance error: {e}")
```

---

## Next Steps

1. ✅ SDK is installed and working
2. ✅ Examples tested successfully
3. **Try it in your chatbot**:
   - Import the SDK
   - Add evaluation calls
   - View results in Endurance dashboard

---

## Support

- **Documentation**: See `endurance-sdk/README.md`
- **Examples**: Run `python endurance-sdk/examples.py`
- **Integration Guide**: See `INTEGRATION_GUIDE.md` for advanced patterns

---

## SDK File Structure

```
endurance-sdk/
├── endurance/
│   ├── __init__.py       # Package exports
│   ├── client.py         # Main EnduranceClient
│   ├── models.py         # Pydantic models
│   └── exceptions.py     # Custom exceptions
├── pyproject.toml        # Package metadata
├── README.md             # Full documentation
└── examples.py           # Working examples
```

---

**🎉 You're ready to integrate Endurance RAI monitoring into your chatbot!**
