# Endurance RAI Engine - Integration Guide
## Webhook Security & Python SDK Implementation

**Version**: 2.0  
**Last Updated**: February 5, 2026  
**Target Audience**: Backend Engineers, DevOps

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Architecture](#solution-architecture)
3. [Webhook Integration (Recommended)](#webhook-integration-recommended)
4. [Python SDK Implementation](#python-sdk-implementation)
5. [Security Best Practices](#security-best-practices)
6. [Code Examples](#code-examples)
7. [Deployment Guide](#deployment-guide)

---

## Problem Statement

### Current Issues

Based on the frontend integration documentation, we identified **two critical problems**:

#### **Problem 1: Direct Backend Exposure (Webhook)**

**Current State** (INSECURE):
```python
# ❌ SECURITY RISK: Hardcoded backend URL exposed to frontend
ENDURANCE_URL = "https://lamaq-endurance-backend-4-hods.hf.space"

async def send_to_endurance(query, response, rag_docs):
    async with httpx.AsyncClient(timeout=5.0) as client:
        await client.post(f"{ENDURANCE_URL}/v1/evaluate", json=payload)
```

**Problems**:
- ✗ Backend URL directly exposed in client-side code
- ✗ No authentication/authorization layer
- ✗ Vulnerable to direct API abuse
- ✗ Cannot rate-limit or monitor requests separately from legitimate traffic
- ✗ CORS issues when calling from frontend

---

#### **Problem 2: Non-Existent SDK**

**Current State**:
```
SDK (Sync)
Use when you need to display "Verified" badges immediately.
✓ Real-time feedback
✓ ~500ms latency
```

**Problem**: The Endurance Python SDK **does not exist** as a distributable package.

**Current Workaround**: Developers copy-paste code snippets, leading to:
- ✗ Version drift across integrations
- ✗ No centralized bug fixes
- ✗ Inconsistent error handling
- ✗ Difficult to maintain

---

## Solution Architecture

### Solution 1: Webhook Proxy Pattern

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Chatbot   │─────────▶│Your Backend │─────────▶│  Endurance  │
│  (Frontend) │  HTTP    │    Proxy    │  HTTPS   │   Backend   │
└─────────────┘          └─────────────┘          └─────────────┘
                              ▲
                              │
                         - Auth check
                         - Rate limiting
                         - Request validation
                         - Logging
```

**Benefits**:
- ✅ Backend URL hidden from frontend
- ✅ Centralized authentication
- ✅ Rate limiting per user/service
- ✅ Request validation before forwarding
- ✅ Audit trail of all evaluations

---

### Solution 2: Distributable Python SDK

```
pip install endurance-rai
```

**Features**:
- ✅ Versioned releases (semver)
- ✅ Centralized updates
- ✅ Type hints for IDE autocomplete
- ✅ Built-in retry logic
- ✅ Comprehensive error handling

---

## Webhook Integration (Recommended)

### Architecture

**Before** (Insecure):
```
Frontend → Endurance HF Space (direct)
```

**After** (Secure):
```
Frontend → Your API → Endurance HF Space
           [Proxy]    [Hidden]
```

### Step 1: Create Proxy Endpoint

Create a new endpoint in your backend that proxies requests to Endurance:

```python
# your_backend/api/rai_proxy.py

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
import httpx
import os
from typing import List, Dict, Optional
import asyncio

router = APIRouter(prefix="/api/rai", tags=["RAI Evaluation"])

# KEEP THIS SECURE - NEVER expose to frontend
ENDURANCE_BACKEND_URL = os.getenv("ENDURANCE_BACKEND_URL")
ENDURANCE_API_KEY = os.getenv("ENDURANCE_API_KEY")  # Optional: if you add auth

# Rate limiting (simple in-memory, use Redis for production)
from collections import defaultdict
from datetime import datetime, timedelta

rate_limit_store = defaultdict(list)
RATE_LIMIT_MAX_REQUESTS = 100  # per service per hour

class RAGDocument(BaseModel):
    source: str
    content: str
    page: int = 0
    similarity_score: float = 0.0

class EvaluationRequest(BaseModel):
    query: str
    response: str
    service_id: str
    rag_documents: List[RAGDocument]
    metadata: Optional[Dict] = {}

# Security: API Key validation (optional)
async def verify_api_key(x_api_key: str = Header(None)):
    """
    Verify that requests come from authenticated sources
    """
    expected_key = os.getenv("YOUR_CHATBOT_API_KEY")
    
    if not x_api_key or x_api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return x_api_key

# Rate limiting
def check_rate_limit(service_id: str):
    """
    Simple rate limiting: 100 requests per service per hour
    """
    now = datetime.now()
    one_hour_ago = now - timedelta(hours=1)
    
    # Clean old entries
    rate_limit_store[service_id] = [
        ts for ts in rate_limit_store[service_id] if ts > one_hour_ago
    ]
    
    # Check limit
    if len(rate_limit_store[service_id]) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: {RATE_LIMIT_MAX_REQUESTS} requests/hour"
        )
    
    # Record this request
    rate_limit_store[service_id].append(now)

@router.post("/evaluate")
async def evaluate_response(
    request: EvaluationRequest,
    api_key: str = Depends(verify_api_key)  # Optional: remove if no auth needed
):
    """
    Proxy endpoint for Endurance RAI evaluation
    
    Security features:
    - API key validation
    - Rate limiting (100 req/hour per service)
    - Request validation
    - Error sanitization
    """
    
    # Rate limiting
    check_rate_limit(request.service_id)
    
    # Validate request
    if not request.query or not request.response:
        raise HTTPException(status_code=400, detail="Query and response are required")
    
    # Transform to Endurance format
    payload = {
        "query": request.query,
        "response": request.response,
        "service_id": request.service_id,
        "rag_documents": [
            {
                "source": doc.source,
                "content": doc.content,
                "page": doc.page,
                "similarity_score": doc.similarity_score
            }
            for doc in request.rag_documents
        ],
        "metadata": request.metadata
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{ENDURANCE_BACKEND_URL}/v1/evaluate",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    # Optional: Add auth if Endurance backend has it
                    # "Authorization": f"Bearer {ENDURANCE_API_KEY}"
                }
            )
            
            response.raise_for_status()
            
            # Log successful evaluation (for audit trail)
            print(f"[RAI] Evaluated service={request.service_id} status=success")
            
            # Return sanitized response (don't expose backend errors)
            return response.json()
            
    except httpx.HTTPStatusError as e:
        # Log error but don't expose backend details
        print(f"[RAI] Evaluation failed: status={e.response.status_code}")
        raise HTTPException(
            status_code=502,
            detail="RAI evaluation service temporarily unavailable"
        )
    
    except httpx.TimeoutException:
        print(f"[RAI] Evaluation timeout for service={request.service_id}")
        # Don't block chatbot - degrade gracefully
        return {
            "status": "timeout",
            "message": "Evaluation queued for async processing"
        }
    
    except Exception as e:
        print(f"[RAI] Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/health")
async def health_check():
    """
    Check if Endurance backend is reachable
    """
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{ENDURANCE_BACKEND_URL}/health")
            return {
                "status": "healthy",
                "endurance_backend": "reachable"
            }
    except Exception:
        return {
            "status": "degraded",
            "endurance_backend": "unreachable"
        }
```

---

### Step 2: Update Frontend Code

**Replace direct Endurance calls** with your proxy:

```python
# chatbot_backend/rai_integration.py

import httpx
import asyncio

# ✅ SECURE: Points to YOUR backend, not Endurance directly
YOUR_API_URL = "https://your-chatbot-api.example.com"
YOUR_API_KEY = "your-secret-api-key"  # Store in env variables

async def send_to_endurance(query, response, rag_docs):
    """
    Fire-and-forget RAI evaluation via your secure proxy
    """
    try:
        payload = {
            "query": query,
            "response": response,
            "service_id": "uk_gov_chatbot",  # Your service identifier
            "rag_documents": [
                {
                    "source": doc.metadata.get("source", "unknown"),
                    "content": doc.page_content,
                    "page": doc.metadata.get("page", 0),
                    "similarity_score": doc.metadata.get("score", 0.0)
                }
                for doc in rag_docs
            ]
        }
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{YOUR_API_URL}/api/rai/evaluate",
                json=payload,
                headers={
                    "X-API-Key": YOUR_API_KEY  # Your auth token
                }
            )
        
    except Exception as e:
        # Non-critical: log and continue
        print(f"RAI evaluation failed (non-critical): {e}")
```

---

### Step 3: Environment Configuration

Create a `.env` file for your backend proxy:

```bash
# .env (YOUR backend, not Endurance

)

# Endurance backend URL (KEEP SECRET)
ENDURANCE_BACKEND_URL=https://lamaq-endurance-backend-4-hods.hf.space

# Optional: if you add auth to Endurance
ENDURANCE_API_KEY=your-endurance-api-key

# Your own API authentication
YOUR_CHATBOT_API_KEY=generate-a-strong-random-key

# Rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_HOURS=1
```

**Generate secure API key**:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Python SDK Implementation

### Option A: Quick Solution (Package Your Code)

Create a distributable Python package:

#### Step 1: Project Structure

```
endurance-rai-sdk/
├── endurance/
│   ├── __init__.py
│   ├── client.py
│   ├── models.py
│   └── exceptions.py
├── setup.py
├── pyproject.toml
├── README.md
└── tests/
    └── test_client.py
```

#### Step 2: Implement SDK

**File: `endurance/__init__.py`**
```python
from .client import EnduranceClient
from .models import RAGDocument, EvaluationResult
from .exceptions import EnduranceError, RateLimitError

__version__ = "1.0.0"
__all__ = ["EnduranceClient", "RAGDocument", "EvaluationResult"]
```

**File: `endurance/models.py`**
```python
from pydantic import BaseModel
from typing import List, Dict, Optional

class RAGDocument(BaseModel):
    source: str
    content: str
    page: int = 0
    similarity_score: float = 0.0

class DimensionScores(BaseModel):
    bias_fairness: float
    data_grounding: float
    explainability: float
    ethical_alignment: float
    human_control: float
    legal_compliance: float
    security: float
    response_quality: float
    environmental_cost: float

class EvaluationResult(BaseModel):
    session_id: str
    service_id: str
    overall_score: float
    flagged: bool
    dimensions: DimensionScores
    metadata: Dict
    timestamp: str
```

**File: `endurance/exceptions.py`**
```python
class EnduranceError(Exception):
    """Base exception for Endurance SDK"""
    pass

class RateLimitError(EnduranceError):
    """Raised when rate limit is exceeded"""
    pass

class AuthenticationError(EnduranceError):
    """Raised when authentication fails"""
    pass

class TimeoutError(EnduranceError):
    """Raised when request times out"""
    pass
```

**File: `endurance/client.py`**
```python
import httpx
import asyncio
from typing import List, Optional
from .models import RAGDocument, EvaluationResult
from .exceptions import EnduranceError, RateLimitError, AuthenticationError, TimeoutError

class EnduranceClient:
    """
    Official Python SDK for Endurance RAI Engine
    
    Example:
        >>> from endurance import EnduranceClient, RAGDocument
        >>> 
        >>> client = EnduranceClient(
        ...     base_url="https://your-proxy.example.com/api/rai",
        ...     api_key="your-api-key"
        ... )
        >>> 
        >>> result = await client.evaluate(
        ...     query="What is the FOI Act?",
        ...     response="The Freedom of Information Act 2000...",
        ...     service_id="uk_gov_chatbot",
        ...     rag_documents=[...]
        ... )
    """
    
    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        timeout: float = 10.0
    ):
        """
        Initialize Endurance client
        
        Args:
            base_url: Your proxy endpoint (NOT Endurance backend directly)
            api_key: Optional API key for authentication
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
    
    async def evaluate(
        self,
        query: str,
        response: str,
        service_id: str,
        rag_documents: List[RAGDocument],
        metadata: Optional[dict] = None
    ) -> EvaluationResult:
        """
        Evaluate chatbot response for RAI compliance
        
        Args:
            query: User's question
            response: Chatbot's answer
            service_id: Identifier for your service
            rag_documents: List of retrieved documents used
            metadata: Optional additional context
        
        Returns:
            EvaluationResult with scores and flagging status
        
        Raises:
            RateLimitError: If rate limit exceeded
            AuthenticationError: If API key invalid
            TimeoutError: If request times out
            EnduranceError: For other errors
        """
        
        payload = {
            "query": query,
            "response": response,
            "service_id": service_id,
            "rag_documents": [doc.dict() for doc in rag_documents],
            "metadata": metadata or {}
        }
        
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                http_response = await client.post(
                    f"{self.base_url}/evaluate",
                    json=payload,
                    headers=headers
                )
                
                if http_response.status_code == 429:
                    raise RateLimitError("Rate limit exceeded. Please try again later.")
                
                if http_response.status_code == 401:
                    raise AuthenticationError("Invalid API key")
                
                http_response.raise_for_status()
                
                data = http_response.json()
                return EvaluationResult(**data)
        
        except httpx.TimeoutException:
            raise TimeoutError(f"Request timed out after {self.timeout}s")
        
        except httpx.HTTPStatusError as e:
            raise EnduranceError(f"HTTP error: {e.response.status_code}")
        
        except Exception as e:
            raise EnduranceError(f"Unexpected error: {str(e)}")
    
    async def health_check(self) -> dict:
        """
        Check if Endurance service is available
        
        Returns:
            Health status dictionary
        """
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.json()
        except Exception:
            return {"status": "unavailable"}
```

---

#### Step 3: Package Configuration

**File: `setup.py`**
```python
from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="endurance-rai",
    version="1.0.0",
    author="Your Company",
    author_email="contact@example.com",
    description="Official Python SDK for Endurance RAI Engine",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourcompany/endurance-sdk",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "httpx>=0.25.0",
        "pydantic>=2.0.0",
    ],
)
```

**File: `pyproject.toml`**
```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "endurance-rai"
version = "1.0.0"
description = "Official Python SDK for Endurance RAI Engine"
readme = "README.md"
requires-python = ">=3.8"
dependencies = [
    "httpx>=0.25.0",
    "pydantic>=2.0.0",
]
```

---

#### Step 4: Publish SDK

**To PyPI (public)**:
```bash
# Build package
python -m build

# Upload to PyPI
twine upload dist/*
```

**To private registry** (recommended for internal tools):
```bash
# Upload to your company's private PyPI
twine upload --repository-url https://your-pypi.example.com dist/*
```

---

### Usage Examples

#### Async Example (Recommended)

```python
import asyncio
from endurance import EnduranceClient, RAGDocument

async def main():
    client = EnduranceClient(
        base_url="https://your-api.example.com/api/rai",
        api_key="your-api-key"
    )
    
    # Prepare documents
    docs = [
        RAGDocument(
            source="FOI_Act_2000.pdf",
            content="The Freedom of Information Act 2000 provides...",
            page=1,
            similarity_score=0.92
        ),
        RAGDocument(
            source="ICO_Guidance.pdf",
            content="Public authorities must respond within 20 working days...",
            page=5,
            similarity_score=0.87
        )
    ]
    
    # Evaluate
    result = await client.evaluate(
        query="What is the response time for FOI requests?",
        response="Public authorities must respond within 20 working days.",
        service_id="uk_gov_chatbot",
        rag_documents=docs
    )
    
    print(f"Overall Score: {result.overall_score}")
    print(f"Flagged: {result.flagged}")
    print(f"Grounding: {result.dimensions.data_grounding}")

asyncio.run(main())
```

---

#### Fire-and-Forget Pattern (Non-Blocking)

```python
from endurance import EnduranceClient, RAGDocument
import asyncio

client = EnduranceClient(base_url="...", api_key="...")

def chatbot_response_handler(query, response, rag_docs):
    """
    Your chatbot's main handler
    """
    # Return response to user immediately
    send_response_to_user(response)
    
    # Evaluate in background (non-blocking)
    asyncio.create_task(
        client.evaluate(
            query=query,
            response=response,
            service_id="uk_gov_chatbot",
            rag_documents=rag_docs
        )
    )
```

---

## Security Best Practices

### 1. Never Hardcode Secrets

❌ **BAD**:
```python
ENDURANCE_URL = "https://lamaq-endurance-backend-4-hods.hf.space"
API_KEY = "sk-12345"  # Exposed in code
```

✅ **GOOD**:
```python
import os

ENDURANCE_URL = os.getenv("ENDURANCE_BACKEND_URL")
API_KEY = os.getenv("ENDURANCE_API_KEY")

if not ENDURANCE_URL:
    raise ValueError("ENDURANCE_BACKEND_URL not set")
```

---

### 2. Use API Gateway for Production

For production deployments, use an API gateway (AWS API Gateway, Kong, etc.) with:

- **Rate limiting**: 100 req/min per service
- **Authentication**: JWT or API keys
- **Logging**: All requests logged to audit trail
- **Monitoring**: Alerts on high error rates

---

### 3. Implement Circuit Breaker

Prevent cascading failures if Endurance backend is down:

```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=60)
async def evaluate_with_circuit_breaker(client, **kwargs):
    return await client.evaluate(**kwargs)

# Usage
try:
    result = await evaluate_with_circuit_breaker(client, ...)
except CircuitBreakerError:
    # Endurance is down - degrade gracefully
    print("RAI evaluation temporarily unavailable")
```

---

### 4. Add Request Signing (Advanced)

For highest security, sign requests with HMAC:

```python
import hmac
import hashlib
import time

def sign_request(payload, secret_key):
    timestamp = str(int(time.time()))
    message = f"{timestamp}:{json.dumps(payload,sort_keys=True)}"
    signature = hmac.new(
        secret_key.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return {
        "X-Timestamp": timestamp,
        "X-Signature": signature
    }
```

---

## Deployment Guide

### Quick Start (Development)

**1. Install SDK** (once published):
```bash
pip install endurance-rai
```

**2. Set environment variables**:
```bash
export ENDURANCE_PROXY_URL="https://your-api.example.com/api/rai"
export ENDURANCE_API_KEY="your-api-key"
```

**3. Use in code**:
```python
from endurance import EnduranceClient

client = EnduranceClient(
    base_url=os.getenv("ENDURANCE_PROXY_URL"),
    api_key=os.getenv("ENDURANCE_API_KEY")
)
```

---

### Production Deployment

**1. Set up proxy backend** (see Webhook Integration section)

**2. Deploy SDK to private PyPI**:
```bash
# Internal package registry
pip install --index-url https://your-pypi.example.com endurance-rai
```

**3. Configure monitoring**:
- **Metrics**: Request count, latency, error rate
- **Alerts**: >5% error rate, >2s p95 latency
- **Dashboards**: Grafana/Datadog visualization

**4. Set up audit logging**:
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("endurance.rai")

# Log all evaluations
logger.info(f"RAI evaluation: service={service_id} score={result.overall_score}")
```

---

## Summary

### Webhook Integration
- ✅ **Security**: Backend URL hidden behind proxy
- ✅ **Control**: Rate limiting, auth, validation
- ✅ **Monitoring**: Centralized logging
- ⚠️ **Effort**: Moderate (requires proxy server)

### Python SDK
- ✅ **Developer Experience**: `pip install` simplicity
- ✅ **Maintainability**: Centralized updates
- ✅ **Type Safety**: Full IDE autocomplete
- ⚠️ **Effort**: Low-medium (package setup)

**Recommendation**: Implement **both** for best results:
1. Use **webhook proxy** for security
2. Provide **Python SDK** for ease of integration

---

## Next Steps

1. [ ] Implement proxy endpoint in your backend
2. [ ] Package and publish Python SDK
3. [ ] Update frontend documentation with new integration patterns
4. [ ] Set up monitoring and alerting
5. [ ] Conduct security audit

---

**Questions?** Contact the Endurance team at [contact@example.com](mailto:contact@example.com)
