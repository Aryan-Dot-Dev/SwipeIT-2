// Gemini API instance with prompt dictionary
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'your-api-key-here'; // Use VITE_ prefix for Vite environment variables
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;

// Dictionary of prompts
const PROMPTS = {
  summarize_profile: "Summarize the following candidate profile: {data} without including the name and email of the candidate and the ids of the candidate and company. That is not necessary, just describe him according to the resume. Only keep relevant information about the candidate professional wise.",
  generate_response: "Generate a response to this message: {data}",
  analyze_skills: "Analyze the skills in this profile: {data}",
  analyze_resume: `
  You are an expert career coach and resume reviewer. Analyze the following resume and provide your evaluation strictly in the JSON format described below—return ONLY raw JSON, no additional commentary, explanation, or natural language.
Base your response solely on the resume and general hiring best practices.

JSON Output Structure:

{
  "strengths_and_highlights": [
    "Point out the strongest aspects of the resume that make the candidate appealing to employers.",
    "Use bullet-point style strings for each highlight."
  ],
  "scope_of_improvement": [
    "Identify specific, actionable areas where the resume could be improved (e.g., formatting, clarity, skills alignment, quantified achievements, action verbs, etc.).",
    "Each item should be a concise bullet point with a practical suggestion."
  ],
  "what_makes_others_stand_out": [
    "List qualities or elements found in strong resumes that typically make others stand out (e.g., measurable impact, leadership, industry keywords, technical depth, etc.).",
    "For each, briefly suggest how the candidate can integrate this into their resume."
  ],
  "what_makes_this_candidate_the_best": [
    "Highlight unique qualities, experiences, or strengths from the candidate's resume that give them an edge over others.",
    "Frame each as a distinct, positive attribute."
  ]
}
Resume to analyze:
{data}

IMPORTANT: Return ONLY a valid JSON object in your response as described above. No explanations, markdown, code blocks, or additional text.
  `
  // Add more prompts as needed
};

// Function to call Gemini API with prompt key and data
async function callGemini(promptKey, data) {
  if (!PROMPTS[promptKey]) {
    throw new Error(`Prompt key "${promptKey}" not found in prompts dictionary.`);
  }

  const promptTemplate = PROMPTS[promptKey];
  const prompt = promptTemplate.replace('{data}', JSON.stringify(data));

  try {
    // Build request body. For analyze_resume we include a generationConfig
    // that requests a strict JSON response with a responseSchema.
    let requestBody;
    if (promptKey === 'analyze_resume') {
      requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              strengths_and_highlights: { type: 'ARRAY', items: { type: 'STRING' } },
              scope_of_improvement: { type: 'ARRAY', items: { type: 'STRING' } },
              what_makes_others_stand_out: { type: 'ARRAY', items: { type: 'STRING' } },
              what_makes_this_candidate_the_best: { type: 'ARRAY', items: { type: 'STRING' } }
            },
            required: [
              'strengths_and_highlights',
              'scope_of_improvement',
              'what_makes_others_stand_out',
              'what_makes_this_candidate_the_best'
            ]
          }
        }
      };
    } else {
      requestBody = { contents: [{ parts: [{ text: prompt }] }] };
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Robustly extract text from result. The standard path is:
    // result.candidates[0].content.parts[0].text
    try {
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        // If this is the resume analyzer, try to parse JSON so callers and
        // devtools get a real expandable object instead of a JSON string.
        if (promptKey === 'analyze_resume') {
          try {
            const parsed = JSON.parse(text);
            console.log('Gemini (parsed JSON):', parsed); 
            return parsed;
          } catch (parseErr) {
            console.warn('Gemini analyze_resume response is not valid JSON, returning raw text', parseErr);
            console.log('Gemini (raw text):', text);
            return text;
          }
        }

        // For other prompts return the raw text
        console.log('Gemini (text):', text);
        return text;
      }
    } catch {
      // fall through to fallback
    }

    // Some API variants return generated text in other shapes. Try common fallbacks.
    try {
      // Older responses sometimes put the text at result.candidates[0].content[0].text
      const alt = result?.candidates?.[0]?.content?.[0]?.text;
      if (alt) return alt;
    } catch {
      // ignore
    }

    // As a last resort return the stringified JSON so callers can inspect it.
    return JSON.stringify(result);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

// Export the function and prompts for external use
export { callGemini, PROMPTS };