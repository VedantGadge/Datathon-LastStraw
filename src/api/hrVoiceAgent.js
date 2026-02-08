import axios from "axios";

const API_BASE = "https://yashganatra-endurance.hf.space";

export const hrVoiceAPI = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Error handling interceptor
hrVoiceAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("HR Voice API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

/**
 * Get monthly review questions
 * @param {Object} person - { employee_id, email }
 * @param {string} month - YYYY-MM
 * @param {number} topK
 * @param {number} maxQuestions
 */
export const getMonthlyQuestions = async (
  person,
  month,
  topK = 1,
  maxQuestions = 3,
) => {
  const response = await hrVoiceAPI.post("/hr/monthly-review/questions", {
    person,
    month,
    top_k: topK,
    max_questions: maxQuestions,
  });
  return response.data;
};

/**
 * Create a new monthly review session
 * @param {Object} person - { employee_id, email }
 * @param {string} month - YYYY-MM (optional)
 */
export const createSession = async (person, month) => {
  const response = await hrVoiceAPI.post("/hr/monthly-review/session", {
    person,
    month,
  });
  return response.data;
};

/**
 * Post a turn in the session (send user transcript)
 * @param {string} sessionId
 * @param {string} transcriptText
 */
export const postSessionTurn = async (sessionId, transcriptText) => {
  const response = await hrVoiceAPI.post(
    `/hr/monthly-review/session/${sessionId}/turn`,
    {
      transcript_text: transcriptText,
    },
  );
  return response.data;
};

/**
 * Synthesize text to speech
 * @param {string} text
 * @returns {Promise<Blob>} - Audio blob (WAV)
 */
export const synthesizeAudio = async (text) => {
  const response = await hrVoiceAPI.post(
    "/hr/tts",
    { text },
    { responseType: "blob" },
  );
  return response.data;
};
