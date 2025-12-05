import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";

let embeddingModel;
let generativeAI;

if (GEMINI_API_KEY) {
  generativeAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
  console.warn(
    "VITE_GEMINI_API_KEY is not set. Gemini embedding calls will fail until the key is provided."
  );
}

function getEmbeddingModel() {
  if (!generativeAI) {
    throw new Error("Missing Gemini API key. Cannot build embedding model.");
  }

  if (!embeddingModel) {
    embeddingModel = generativeAI.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
  }

  return embeddingModel;
}

/**
 * Embed text (or array of texts) using Gemini embedding API.
 * Note: embedContent expects a single `content` object, not `contents`.
 * If multiple strings are provided, they are joined with double newlines.
 */
export async function generateGeminiEmbeddings(content, options = {}) {
  const texts = Array.isArray(content) ? content.filter(Boolean) : [content].filter(Boolean);
  if (texts.length === 0) return [];

  const outputDimensionality = options.outputDimensionality ?? 768;

  const payload = {
    content: { parts: texts.map(text => ({ text })) },
    outputDimensionality,
  };

  try {
    console.debug('Gemini embed payload preview:', {
      outputDimensionality,
      partsCount: payload.content.parts.length,
      sampleText: payload.content.parts[0]?.text?.slice(0, 120) || null,
    });
  } catch { /* best-effort logging */ }

  const response = await getEmbeddingModel().embedContent(payload);

  return response.embedding?.values ?? [];
}
