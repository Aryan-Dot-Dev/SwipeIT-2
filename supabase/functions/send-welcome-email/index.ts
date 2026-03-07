// supabase/functions/send-welcome-email/index.ts
// Call this from the signup Edge Function (or directly via HTTP after user creation)
// to send a branded welcome email to new users.
//
// POST body: { email: string, name: string }



import { sendEmail, welcomeEmailHtml } from "../_shared/resend.ts"

Deno.serve(async (req: Request) => {
    try {
        // Allow CORS for direct calls
        if (req.method === "OPTIONS") {
            return new Response("ok", {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
                },
            })
        }

        const { email, name } = await req.json()
        if (!email) return new Response("email required", { status: 400 })

        const displayName = name || email.split("@")[0]

        const ok = await sendEmail({
            to: email,
            subject: `Welcome to SwipeIT, ${displayName}! 🎉`,
            html: welcomeEmailHtml(displayName),
        })

        return new Response(JSON.stringify({ success: ok }), {
            headers: { "Content-Type": "application/json" },
        })
    } catch (err) {
        console.error("[send-welcome-email] Error:", err)
        return new Response("Internal error", { status: 500 })
    }
})
