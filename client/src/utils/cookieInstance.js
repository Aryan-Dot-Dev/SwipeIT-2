// Small cookie helper utilities used across the client.
// Keep these pure client-side (document.cookie) and very small.

function _getCookieString() {
	try { return typeof document !== 'undefined' ? document.cookie || '' : '' } catch { return '' }
}

export function getCookie(name) {
	try {
		const str = _getCookieString()
		const m = str.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
		return m ? decodeURIComponent(m[1]) : null
	} catch {
		return null
	}
}

export function setCookie(name, value, opts = {}) {
	try {
		const { path = '/', maxAge = 60 * 60 * 24 * 30, secure = true, sameSite = 'Lax' } = opts
		const encoded = encodeURIComponent(String(value))
		const parts = [`${name}=${encoded}`, `path=${path}`]
		if (maxAge != null) parts.push(`Max-Age=${Math.floor(Number(maxAge))}`)
		if (secure) parts.push('Secure')
		if (sameSite) parts.push(`SameSite=${sameSite}`)
			document.cookie = parts.join('; ')
			return true
		} catch {
			return false
		}
}

export function deleteCookie(name) {
	try {
		// expire immediately
		document.cookie = `${name}=; path=/; max-age=0`
		return true
	} catch {
		return false
	}
}

export function getJSONCookie(name) {
	try {
		const raw = getCookie(name)
		if (!raw) return null
		return JSON.parse(raw)
	} catch {
		return null
	}
}

export function setJSONCookie(name, obj, opts = {}) {
	try {
		return setCookie(name, JSON.stringify(obj), opts)
	} catch {
		return false
	}
}

// Convenience getters for auth tokens
export function getAccessToken() { return getCookie('access_token') }
export function getRefreshToken() { return getCookie('refresh_token') }
export function setAccessToken(token, opts) { return setCookie('access_token', token, opts) }
export function setRefreshToken(token, opts) { return setCookie('refresh_token', token, opts) }

export default {
	getCookie,
	setCookie,
	deleteCookie,
	getJSONCookie,
	setJSONCookie,
	getAccessToken,
	getRefreshToken,
	setAccessToken,
	setRefreshToken,
}

