// Minimal client to call a local open-text-embeddings server (OpenAI-compatible REST)

// supabase not needed in embeddings client

// Default to localhost which is equivalent to 0.0.0.0 for local servers and matches the example
const EMBEDDING_SERVER = import.meta.env.VITE_LOCAL_EMBEDDING_URL || 'http://localhost:8000';
const EMBEDDING_API_KEY = import.meta.env.VITE_LOCAL_EMBEDDING_API_KEY || 'not-needed-for-local';

// Hugging Face inference configuration (optional). If present, we'll call HF instead of local.
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || import.meta.env.VITE_HF_API_KEY || null;
const HUGGINGFACE_MODEL = import.meta.env.VITE_HUGGINGFACE_MODEL || 'BAAI/bge-base-en-v1.5';

// NVIDIA embeddings integration (optional). If present, we'll call NVIDIA's integrate API.
const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY || null;
const NVIDIA_MODEL = import.meta.env.VITE_NVIDIA_MODEL || 'nvidia/llama-3.2-nv-embedqa-1b-v2';
const NVIDIA_ENDPOINT = import.meta.env.VITE_NVIDIA_ENDPOINT || 'https://integrate.api.nvidia.com/v1/embeddings';

/**
 * Create embeddings by POSTing to the local embeddings server in OpenAI-compatible format.
 * body: { model, input, encoding_format }
 */
export async function createEmbedding({ text, model = 'intfloat/e5-large-v2', encoding_format = 'float' } = {}) {
  if (!text) return null;
  // If an NVIDIA API key is provided, use the NVIDIA embeddings API first.
  if (NVIDIA_API_KEY) {
    try {
      const url = NVIDIA_ENDPOINT
      const payload = {
        input: text,
        model: NVIDIA_MODEL,
        input_type: 'query',
        encoding_format: 'float',
        truncate: 'NONE',
        dimensions: 768
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      let nd = null
      try { nd = await res.json() } catch { nd = null }
      console.log('NVIDIA embedding response:', { status: res.status, data: nd })

      const parseEmbeddingFromNvidia = (d) => {
        if (!d) return null
        // common shapes: { data: [{ embedding: [...] }] }, { embeddings: [...] }, { embedding: [...] }
        if (Array.isArray(d.data) && d.data[0] && Array.isArray(d.data[0].embedding)) return d.data[0].embedding
        if (Array.isArray(d.embeddings) && Array.isArray(d.embeddings[0])) return d.embeddings[0]
        if (Array.isArray(d.embedding)) return d.embedding
        // sometimes the API nests under result or output
        if (d.result && Array.isArray(d.result) && Array.isArray(d.result[0])) return d.result[0]
        return null
      }

      const nEmbedding = parseEmbeddingFromNvidia(nd)
      if (res.ok && nEmbedding) return { data: [{ embedding: nEmbedding }] }
      // fallthrough and try HF or local
    } catch (err) {
      console.error('NVIDIA createEmbedding failed', err)
      // fall through to HF/local
    }
  }

  // If a Hugging Face API key is provided, use the HF Inference API.
  if (HUGGINGFACE_API_KEY) {
    try {
      const hfUrl = `https://api-inference.huggingface.co/models/${encodeURIComponent(HUGGINGFACE_MODEL)}`;

      // Primary attempt using the straightforward HF use pattern you provided
      const res = await fetch(hfUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      });

      let data = null;
      try { data = await res.json(); } catch { data = null }
      console.log('Hugging Face embedding response:', { status: res.status, data });

      const parseEmbeddingFrom = (d) => {
        if (!d) return null;
        if (Array.isArray(d) && d.length > 0 && typeof d[0] === 'number') return d;
        if (Array.isArray(d) && Array.isArray(d[0]) && typeof d[0][0] === 'number') return d[0];
        if (Array.isArray(d.embedding)) return d.embedding;
        if (Array.isArray(d.embeddings)) return d.embeddings[0];
        if (Array.isArray(d.data) && d.data[0] && Array.isArray(d.data[0].embedding)) return d.data[0].embedding;
        return null;
      };

      let embedding = parseEmbeddingFrom(data);

      // If HF returned a sentences-related error or no embedding, try the sentence-similarity payload shapes
      const msgText = (data?.error?.message || data?.error || data?.message || JSON.stringify(data || '') || '').toString().toLowerCase();
      const needsSentencesRetry = msgText.includes('sentences') || msgText.includes("sentences'") || msgText.includes('sentences') || msgText.includes('sentence') && msgText.includes('similarity');

      if ((!res.ok || !embedding) && needsSentencesRetry) {
        const altPayloads = [
          { inputs: { source_sentence: text, sentences: [text] } },
          { inputs: { source_sentence: text, sentences: text } },
          { sentences: text },
          { sentences: [text] },
          { inputs: { sentences: text } },
          { inputs: { sentences: [text] } },
        ];

        let tried = [];
        for (const p of altPayloads) {
          tried.push(p);
          try {
            const ar = await fetch(hfUrl, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(p),
            });
            let ad = null; try { ad = await ar.json() } catch { ad = null }
            const aemb = parseEmbeddingFrom(ad);
            if (ar.ok && aemb) {
              return { data: [ { embedding: aemb } ] };
            }
            // if this payload didn't return an embedding, continue
          } catch {
            // ignore and try next
          }
        }
        console.warn('Hugging Face embedding: tried sentence-similarity payloads', tried, 'last response:', data)
        // fall through to local fallback
      }

      if (res.ok && embedding) {
        return { data: [ { embedding } ] };
      }

      return { data: [ { embedding } ] };
    } catch (err) {
      console.error('Hugging Face createEmbedding failed', err);
      // fallthrough to local fallback
    }
  }

  // Fallback to local embedding server (OpenAI-compatible endpoint)
  const url = `${EMBEDDING_SERVER.replace(/\/$/, '')}/v1/embeddings`;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (EMBEDDING_API_KEY) headers['Authorization'] = `Bearer ${EMBEDDING_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, input: text, encoding_format }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Embedding server error', data);
      return null;
    }

    return data;
  } catch (err) {
    console.error('createEmbedding failed', err);
    return null;
  }
}
