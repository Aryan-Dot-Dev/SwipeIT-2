import { createClient } from "@supabase/supabase-js";

const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

console.log("Supabase URL:", import.meta.env);


export { VITE_SUPABASE_ANON_KEY };

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
	auth: {
		// Try to initialize auth from cookies if available (access_token/refresh_token)
		// We don't want to read cookies synchronously in SSR – this is purely client-side.
		persistSession: false,
	},
});

function readCookie(name) {
	try {
		const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
		return m ? decodeURIComponent(m[1]) : null
	} catch { return null }
}

/**
 * Initialize session from cookies (access_token/refresh_token) if present.
 * Returns true if a session was set.
 */
export async function initSessionFromCookies() {
	try {
		const access_token = readCookie('access_token')
		const refresh_token = readCookie('refresh_token')
		if (access_token) {
			// set session on the client so supabase-js will send auth headers
			await supabase.auth.setSession({ access_token, refresh_token })
			return true
		}
	} catch {
		// ignore
	}
	return false
}

export async function getCurrentUser() {
	try {
		// prefer cookies-based session
	await initSessionFromCookies()
	const { data } = await supabase.auth.getUser()
		return data?.user || null
	} catch {
		try {
			const { data } = await supabase.auth.getSession()
			return data?.session?.user || null
		} catch {
			return null
		}
	}
}

export default supabase;