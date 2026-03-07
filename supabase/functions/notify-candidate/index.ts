// supabase/functions/notify-candidate/index.ts
// Called by Supabase Database Webhook when applications.status changes
// Sends an email to the candidate about their application status

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendEmail, applicationStatusHtml } from "../_shared/resend.ts"

const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
)

Deno.serve(async (req: Request) => {
    try {
        const payload = await req.json()

        // Database webhook sends { type, table, record, old_record }
        const record = payload.record
        if (!record) return new Response("No record", { status: 400 })

        const { candidate_id, job_id, status } = record

        // Only send emails for meaningful status changes
        const notifiableStatuses = ["shortlisted", "rejected"]
        if (!notifiableStatuses.includes(status)) {
            return new Response("Status not notifiable", { status: 200 })
        }

        // Fetch candidate email + name
        const { data: candidate, error: candidateError } = await supabase
            .from("candidates")
            .select("name, email")
            .eq("id", candidate_id)
            .single()

        if (candidateError || !candidate?.email) {
            console.error("Could not find candidate email:", candidateError)
            return new Response("Candidate not found", { status: 200 })
        }

        // Fetch job title
        const { data: job } = await supabase
            .from("job_postings")
            .select("title")
            .eq("id", job_id)
            .single()

        const jobTitle = job?.title ?? "a position"
        const candidateName = candidate.name ?? "there"

        await sendEmail({
            to: candidate.email,
            subject: status === "shortlisted"
                ? `🎉 You've been shortlisted for ${jobTitle}!`
                : `Update on your application for ${jobTitle}`,
            html: applicationStatusHtml(candidateName, jobTitle, status as "shortlisted" | "rejected"),
        })

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        })
    } catch (err) {
        console.error("[notify-candidate] Error:", err)
        return new Response("Internal error", { status: 500 })
    }
})
