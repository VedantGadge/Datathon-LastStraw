/**
 * Endurance RAI Monitoring API Client
 * Production API: https://lamaq-endurance-backend-4-hods.hf.space
 */
import axios from "axios";

const API_BASE = "https://lamaq-endurance-backend-4-hods.hf.space";

export const enduranceAPI = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Error handling interceptor
enduranceAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("Network Error:", error.message);
    }
    return Promise.reject(error);
  },
);

/**
 * @typedef {Object} RAGDocument
 * @property {string} source
 * @property {string} content
 * @property {string} [id]
 * @property {number} [page]
 * @property {number} [similarity_score]
 */

/**
 * @typedef {Object} EvaluateRequest
 * @property {string} query
 * @property {string} response
 * @property {string} [service_id]
 * @property {RAGDocument[]} rag_documents
 * @property {Object} [metadata]
 * @property {Object} [custom_weights]
 */

/**
 * @typedef {Object} EvaluateResponse
 * @property {string} session_id
 * @property {string} service_id
 * @property {number} overall_score
 * @property {Object} dimensions
 * @property {{ total_claims: number, verified_claims: number, hallucinated_claims: number, verification_score: number }} verification
 * @property {boolean} flagged
 * @property {string[]} flag_reasons
 * @property {string} timestamp
 */

/**
 * @typedef {Object} Session
 * @property {string} session_id
 * @property {string} service_id
 * @property {string} query
 * @property {string} response
 * @property {number} overall_score
 * @property {Object} dimensions
 * @property {boolean} flagged
 * @property {string} timestamp
 * @property {string[]} [flag_reasons]
 */

/**
 * @typedef {Object} MetricsSummary
 * @property {number} total_sessions
 * @property {number} flagged_sessions
 * @property {number} flagged_percentage
 * @property {number} services_count
 * @property {number} alert_threshold
 * @property {boolean} connected
 */

// API Functions

/**
 * Check API health status
 * @returns {Promise<{ status: string, timestamp: string }>}
 */
export const checkHealth = async () => {
  const response = await enduranceAPI.get("/health");
  return response.data;
};

/**
 * Evaluate a response for hallucinations and compliance
 * @param {EvaluateRequest} data
 * @returns {Promise<EvaluateResponse>}
 */
export const evaluateResponse = async (data) => {
  const response = await enduranceAPI.post("/v1/evaluate", data);
  return response.data;
};

/**
 * Get list of sessions with optional filtering
 * @param {{ limit?: number, service_id?: string, flagged_only?: boolean }} [params]
 * @returns {Promise<{ sessions: Session[], total: number, source: string }>}
 */
export const getSessions = async (params = {}) => {
  const response = await enduranceAPI.get("/v1/sessions", { params });
  return response.data;
};

/**
 * Get details of a specific session
 * @param {string} sessionId
 * @returns {Promise<Session>}
 */
export const getSession = async (sessionId) => {
  const response = await enduranceAPI.get(`/v1/sessions/${sessionId}`);
  return response.data;
};

/**
 * Get list of registered services
 * @returns {Promise<{ services: Object[], source: string }>}
 */
export const getServices = async () => {
  const response = await enduranceAPI.get("/v1/services");
  return response.data;
};

/**
 * Get metrics summary
 * @returns {Promise<MetricsSummary>}
 */
export const getMetrics = async () => {
  const response = await enduranceAPI.get("/v1/metrics/summary");
  return response.data;
};

export const API_URL = API_BASE;
