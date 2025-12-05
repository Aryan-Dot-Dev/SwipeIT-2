// import { supabase } from "@/lib/supabaseClient"

import { getAccessToken, getRefreshToken } from "@/utils/cookieInstance"
import supabase from "@/utils/supabaseInstance"
import { callGemini } from "@/utils/geminiInstance"
import mammoth from 'mammoth'

const SUPABASE_FUNCTIONS_URL = "https://guzggqrlaexecpzyesxm.supabase.co/functions/v1";

async function uploadUserFile(bucket, file) {
  const formData = new FormData();
  formData.append("bucket", bucket);
  formData.append("file", file);

  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/replace_user_file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: formData,
  });

        if (!res.ok) {
            let bodyText = '';
            try { bodyText = await res.text(); } catch { bodyText = '' }
            console.error('replace_user_file failed', { status: res.status, statusText: res.statusText, body: bodyText });
            throw new Error(`Upload failed: ${res.status} ${res.statusText} ${bodyText}`);
        }

    // Expect JSON { path, url }
    try {
        return await res.json();
    } catch {
        console.warn('replace_user_file returned non-json response, returning raw text instead');
        const text = await res.text().catch(() => '');
        return { path: null, url: text };
    }
}

// Extract text from PDF by delegating to the serverless PDF extraction function.
// This keeps the client lightweight and avoids shipping heavy PDF/OCR workers to the browser.
async function extractTextFromPDF(fileOrUrl) {
    try {
        console.log('Delegating PDF extraction to serverless endpoint...');

        const endpoint = 'https://guzggqrlaexecpzyesxm.supabase.co/functions/v1/pdf_extract';

        // The edge function expects JSON body { pdfUrl: string }
        const pdfUrl = typeof fileOrUrl === 'string' ? fileOrUrl : null;
        if (!pdfUrl) {
            throw new Error('No pdfUrl provided to remote extractor. Pass the public URL of the uploaded PDF.');
        }

        // Include the user's access token so the Edge Function can authenticate the request
        // const token = getAccessToken();
        // const headers = {
        //     'Content-Type': 'application/json',
        //     'Accept': 'application/json, text/plain',
        //     'Authorization': `Bearer ${getAccessToken()}`
        // };
        // if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(endpoint, {
            method: 'POST',
            
            body: JSON.stringify({ pdfUrl })
        });

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            throw new Error(`Remote PDF extraction failed: ${res.status} ${res.statusText} ${body}`);
        }

        // Prefer JSON if the function returns structured data, otherwise treat as plain text
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const json = await res.json();
            // If the function returns an object with text field, return it
            if (typeof json === 'object' && json !== null) {
                if (json.text) return json.text;
                return JSON.stringify(json);
            }
            return String(json);
        }

    const text = await res.text();
    const nameOrUrl = typeof fileOrUrl === 'string' ? fileOrUrl : (fileOrUrl && fileOrUrl.name) || '<uploaded file>';
    return text || `Remote PDF extraction returned no text. File/URL: ${nameOrUrl}`;

    } catch (err) {
    console.error('Remote PDF extraction failed:', err);
    const nameOrUrl = typeof fileOrUrl === 'string' ? fileOrUrl : (fileOrUrl && fileOrUrl.name) || '<uploaded file>';
    return `PDF text extraction failed (remote). File/URL: ${nameOrUrl}. Error: ${err.message}`;
    }
}

// PDFs are extracted by the remote serverless function; local garbled-text heuristic removed.

// Local OCR and PDF parsing removed: PDFs are extracted remotely by your serverless endpoint.
async function extractTextFromWord(file) {
    try {
        console.log('Starting Word document text extraction...');
        const arrayBuffer = await file.arrayBuffer();

        if (arrayBuffer.byteLength === 0) {
            throw new Error('File appears to be empty');
        }

        console.log('Word file loaded, size:', arrayBuffer.byteLength, 'bytes');

        const result = await mammoth.extractRawText({
            arrayBuffer,
            // Add options to handle various Word formats
            styleMap: [
                "p[style-name='Title'] => h1",
                "p[style-name='Heading 1'] => h2",
                "p[style-name='Heading 2'] => h3"
            ]
        });

        let extractedText = result.value || '';

        // Clean up the extracted text
        extractedText = extractedText
            .replace(/\n\s*\n/g, '\n') // Remove excessive newlines
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        if (!extractedText || extractedText.trim().length < 50) {
            console.warn('Word document contains very little text or is image-based');
            return `This Word document appears to contain minimal text content (${extractedText.length} characters extracted). For best results, please ensure your document has substantial text content and is not image-based. File: ${file.name}`;
        }

        console.log('Word document text extraction completed successfully, length:', extractedText.length);
        return extractedText;

    } catch (error) {
        console.error('Error extracting text from Word document:', error);

        // Provide specific error messages
        if (error.message.includes('Invalid') || error.message.includes('corrupt')) {
            return `The Word document appears to be corrupted or in an unsupported format. File: ${file.name}. Please try saving it as a .docx file or check the file integrity.`;
        } else if (error.message.includes('empty')) {
            return `The Word document appears to be empty. File: ${file.name}. Please check the file and try again.`;
        } else {
            return `Failed to extract text from Word document: ${error.message}. File: ${file.name}. Please try uploading a PDF instead.`;
        }
    }
}

// Function to extract text from any supported file type
async function extractTextFromFile(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    try {
        switch (fileExtension) {
            case 'pdf':
                return await extractTextFromPDF(file);
            case 'docx':
            case 'doc':
                return await extractTextFromWord(file);
            default:
                console.warn(`Unsupported file type for text extraction: ${fileExtension}`);
                return `Content from ${file.name} - Text extraction not supported for .${fileExtension} files.`;
        }
    } catch (error) {
        console.error('Text extraction failed:', error);
        return `Content from ${name} - Text extraction failed: ${error.message}`;
    }
}

await supabase.auth.setSession({
    access_token: getAccessToken(),
    refresh_token: getRefreshToken()
})


// Helper function to sanitize filename by removing spaces and special characters
function sanitizeFilename(filename) {
    // Split filename and extension
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
        // No extension found, sanitize the whole filename
        return filename
            .replace(/\s+/g, '') // Remove all whitespace
            .replace(/[()[\]{}]/g, '') // Remove parentheses, brackets, braces
            .replace(/[^a-zA-Z0-9._-]/g, '') // Remove any other special characters except dots, underscores, and hyphens
            .replace(/\.+/g, '.') // Replace multiple dots with single dot
            .toLowerCase(); // Convert to lowercase for consistency
    }

    // Separate name and extension
    const name = filename.substring(0, lastDotIndex);
    const extension = filename.substring(lastDotIndex); 

    // Sanitize the name part only, preserve extension
    const sanitizedName = name
        .replace(/\s+/g, '') // Remove all whitespace
        .replace(/[()[\]{}]/g, '') // Remove parentheses, brackets, braces
        .replace(/[^a-zA-Z0-9._-]/g, '') // Remove any other special characters except dots, underscores, and hyphens
        .replace(/\.+/g, '.') // Replace multiple dots with single dot
        .toLowerCase(); // Convert to lowercase for consistency

    return sanitizedName + extension.toLowerCase();
}

// Example: Upload profile picture
async function uploadPfp(file, userId, userType) {
    try {
        // Ensure bucket exists (simple check)

        // Sanitize filename by removing spaces
        const sanitizedFilename = sanitizeFilename(file.name);
        console.log('Original filename:', file.name);
        console.log('Sanitized filename:', sanitizedFilename);

        // Use the new uploadUserFile function instead of client-side upload
        const uploadResult = await uploadUserFile("avatars", file);
        const url = uploadResult.url;
        console.log('Upload path:', uploadResult.path);
        console.log('Generated URL:', uploadResult.url);

        // Update the appropriate profile image field based on user type
        let updateError

        if (userType === 'candidate') {
            const result = await supabase
                .from('candidates')
                .update({ profile_img: url })
                .eq('user_id', userId)
            updateError = result.error
        } else if (userType === 'recruiter') {
            const result = await supabase
                .from('recruiters')
                .update({ profile_img: url })
                .eq('user_id', userId)
            updateError = result.error
        } else {
            throw new Error('Invalid user type. Must be "candidate" or "recruiter"')
        }

        if (updateError) {
            console.error('Error updating profile image in database:', updateError)
            throw updateError
        }

        console.log(`Profile image updated successfully for ${userType}:`, userId)
        return url

    } catch (error) {
        console.error('Error in uploadPfp:', error)
        throw error
    }
}

// Example: Upload resume
async function uploadResume(file, userId) {
    try {
        // Get the file extension from the original filename
        const fileExtension = file.name.split('.').pop().toLowerCase();
        // Always use "resume" as the base filename with original extension
        const standardizedFilename = `resume.${fileExtension}`;
        
        console.log('Original filename:', file.name);
        console.log('Standardized filename:', standardizedFilename);

        // Use the new uploadUserFile function instead of client-side upload
        const uploadResult = await uploadUserFile("resumes", file);
        const publicUrl = uploadResult.url;
        console.log('Upload path:', uploadResult.path);
        console.log('Generated URL:', publicUrl);

        // Extract text from the file
        let extractedText = '';
        try {
            console.log(`Starting text extraction for ${fileExtension} file: ${file.name}`);
            // For PDFs, pass the public URL so the edge function can fetch the file by URL
            if (fileExtension === 'pdf') {
                if (publicUrl) {
                    // Call the remote extractor directly with the public URL
                    extractedText = await extractTextFromPDF(publicUrl);
                } else {
                    console.warn('Public URL missing; falling back to extracting from uploaded File directly');
                    extractedText = await extractTextFromFile(file);
                }
            } else {
                // Non-PDF files: extract directly from the File object
                extractedText = await extractTextFromFile(file);
            }
            console.log(`Text extraction completed successfully. Extracted ${extractedText.length} characters.`);
            
            // Log a preview of the extracted text
            const preview = extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : '');
            console.log('Text preview:', preview);
            
            // Limit text length for AI processing (to avoid token limits)
            if (extractedText.length > 10000) {
                extractedText = extractedText.substring(0, 10000) + '...[truncated due to length]';
                console.log('Text truncated to 10,000 characters for AI processing');
            }
        } catch (textError) {
            console.warn('Text extraction failed:', textError);
            extractedText = `Resume uploaded: ${file.name} - Text extraction failed: ${textError.message}. The file was uploaded successfully but AI analysis could not be performed.`;
        }

        // Analyze resume with Gemini AI
        let aiReport = null;
        try {
            console.log('Analyzing resume with Gemini AI...');
            const aiResponse = await callGemini('analyze_resume', extractedText);
            
            // Try to parse the JSON response
            try {
                const parsedResponse = aiResponse;
                aiReport = {
                    extracted_text_length: extractedText.length,
                    analysis_timestamp: new Date().toISOString(),
                    structured_data: parsedResponse.structured_data || {},
                    detailed_analysis: parsedResponse.detailed_analysis || {},
                    raw_response: aiResponse,
                    success: true
                };
                console.log('AI analysis completed successfully');
            } catch (parseError) {
                console.warn('Failed to parse AI response as JSON:', parseError);
                aiReport = { 
                    error: 'Failed to parse AI response as JSON',
                    extracted_text_length: extractedText.length,
                    analysis_timestamp: new Date().toISOString(),
                    raw_response: aiResponse,
                    success: false
                };
            }
        } catch (aiError) {
            console.warn('AI analysis failed:', aiError);
            aiReport = { 
                error: `AI analysis failed: ${aiError.message}`,
                extracted_text_length: extractedText.length,
                analysis_timestamp: new Date().toISOString(),
                success: false
            };
        }

        // Insert or update the resumes table
        const resumeRecord = {
            candidate_id: userId,
            file_url: publicUrl,
            ai_report: aiReport,
            status: 'active'
        };
        
        const { error: resumeError } = await supabase
            .from('resumes')
            .upsert(resumeRecord, { onConflict: ['candidate_id'] }) // Ensure we update the existing record for this candidate;

            
        if (resumeError) {
            console.error('Error updating resumes table:', resumeError);
            // Don't throw here, as the file upload was successful
        } else {
            console.log('Resume record saved to database successfully');
        }

        console.log('Resume uploaded and updated successfully for candidate:', userId)
        return {
            url: publicUrl,
            filename: standardizedFilename,
            aiReport: aiReport
        };

    } catch (error) {
        console.error('Error in uploadResume:', error)
        throw error
    }
}

export { uploadPfp, uploadResume, uploadUserFile }

// Re-run AI analysis for an existing resume URL and persist the updated report
export async function rescanResume({ candidateId, resumeUrl, resumeId } = {}) {
    if (!resumeUrl) throw new Error('resumeUrl is required for rescanning');

    // Extract text from the existing resume file
    const extractedText = await extractTextFromPDF(resumeUrl);

    let aiReport = null;
    try {
        const aiResponse = await callGemini('analyze_resume', extractedText);
        aiReport = {
            extracted_text_length: extractedText.length,
            analysis_timestamp: new Date().toISOString(),
            structured_data: aiResponse.structured_data || {},
            detailed_analysis: aiResponse.detailed_analysis || {},
            raw_response: aiResponse,
            success: true,
        };
    } catch (err) {
        aiReport = {
            error: `AI analysis failed: ${err.message}`,
            extracted_text_length: extractedText.length,
            analysis_timestamp: new Date().toISOString(),
            success: false,
        };
    }

    // Persist the refreshed analysis; prefer candidate_id conflict, but include resume id when available
    try {
        if (candidateId || resumeId) {
            const resumeRecord = {
                ...(resumeId ? { id: resumeId } : {}),
                candidate_id: candidateId || null,
                file_url: resumeUrl,
                ai_report: aiReport,
                status: 'active',
            };
            await supabase
                .from('resumes')
                .upsert(resumeRecord, { onConflict: ['candidate_id'] });
        }
    } catch (dbErr) {
        console.warn('rescanResume upsert warning:', dbErr);
    }

    return aiReport;
}