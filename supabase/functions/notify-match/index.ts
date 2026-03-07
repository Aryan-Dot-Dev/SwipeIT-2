// supabase/functions/notify-match/index.ts
// Called by Supabase Database Webhook when a recruiter swipes right (accepted)
// AND the candidate already has an application → it's a match!
// Sends match emails to BOTH the candidate and recruiter.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendEmail, matchEmailHtml } from "../_shared/resend.ts"

const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
)

Deno.serve(async (req: Request) => {
    try {
        const payload = await req.json()
        const record = payload.record
        if (!record) return new Response("No record", { status: 400 })

        // Only fire when status is set to shortlisted (recruiter accepted)
        if (record.status !== "shortlisted") {
            return new Response("Not a match event", { status: 200 })
        }

        const { candidate_id, job_id } = record

        // Fetch candidate
        const { data: candidate } = await supabase
            .from("candidates")
            .select("name, email")
            .eq("id", candidate_id)
            .single()

        // Fetch job + recruiter
        const { data: job } = await supabase
            .from("job_postings")
            .select("title, recruiter_id")
            .eq("id", job_id)
            .single()

        if (!job) return new Response("Job not found", { status: 200 })

        // Fetch recruiter
        const { data: recruiter } = await supabase
            .from("recruiters")
            .select("name, email")
            .eq("id", job.recruiter_id)
            .single()

        const jobTitle = job.title ?? "a position"
        const candidateName = candidate?.name ?? "the candidate"
        const recruiterName = recruiter?.name ?? "the recruiter"

        const emailPromises: Promise<boolean>[] = []

        // Email to candidate
        if (candidate?.email) {
            emailPromises.push(sendEmail({
                to: candidate.email,
                subject: `🎉 It's a match! ${recruiterName} wants to connect`,
                html: matchEmailHtml(candidateName, recruiterName, jobTitle),
            }))
        }

        // Email to recruiter
        if (recruiter?.email) {
            emailPromises.push(sendEmail({
                to: recruiter.email,
                subject: `🎉 You matched with ${candidateName} for ${jobTitle}`,
                html: matchEmailHtml(recruiterName, candidateName, jobTitle),
            }))
        }

        await Promise.allSettled(emailPromises)

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        })
    } catch (err) {
        console.error("[notify-match] Error:", err)
        return new Response("Internal error", { status: 500 })
    }
})
