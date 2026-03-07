import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { login, waitForAuthChange, sendOtp, verifyOtp } from "../api/auth.api"
import { LoadingSpinner } from '@/components/LoadingSpinner'

const schema = yup.object({
    email: yup.string().email("Enter a valid email").required("Email is required"),
    password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
}).required()

export function LoginForm({
    className,
    ...props
}) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState("")
    const [mode, setMode] = useState("password") // "password" | "otp"

    // OTP state
    const [otpEmail, setOtpEmail] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [otpSent, setOtpSent] = useState(false)
    const [otpError, setOtpError] = useState("")

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    })

    const onSubmit = async (data) => {
        setServerError("")
        setLoading(true)
        try {
            const prevToken = (typeof document !== 'undefined') ? (document.cookie.match(new RegExp('(?:^|; )' + 'access_token' + '=([^;]*)')) ? decodeURIComponent(document.cookie.match(new RegExp('(?:^|; )' + 'access_token' + '=([^;]*)'))[1]) : null) : null
            const response = await login(data.email, data.password)
            if (!response) {
                setServerError("Login failed")
            } else if (response.error) {
                setServerError(response.error || "Login failed")
            } else {
                try { await waitForAuthChange(prevToken, 2500) } catch { /* ignore */ }
                navigate("/dashboard")
            }
        } catch (error) {
            setServerError(error?.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    const handleSendOtp = async () => {
        setOtpError("")
        if (!otpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
            setOtpError("Enter a valid email address")
            return
        }
        setLoading(true)
        try {
            await sendOtp(otpEmail)
            setOtpSent(true)
        } catch (err) {
            setOtpError(err?.message || "Failed to send OTP. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        setOtpError("")
        if (!otpCode || otpCode.length < 6) {
            setOtpError("Enter the 6-digit code from your email")
            return
        }
        setLoading(true)
        try {
            await verifyOtp(otpEmail, otpCode)
            navigate("/dashboard")
        } catch (err) {
            setOtpError(err?.message || "Invalid or expired code. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass-panel max-w-md w-full">
            <div className={cn("flex flex-col gap-6 p-6", className)} {...props}>
                {/* Header */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Welcome Back</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        {mode === "otp" ? "We'll send a one-time code to your email" : "Enter your credentials to sign in"}
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex rounded-xl border border-[#E4DFF5] overflow-hidden bg-[#F6F5FA]">
                    <button
                        type="button"
                        onClick={() => { setMode("password"); setServerError(""); setOtpError("") }}
                        className={`flex-1 py-2 text-sm font-semibold transition-all duration-200 ${mode === "password" ? "text-white rounded-xl shadow-sm" : "text-[#6E6B86]"}`}
                        style={mode === "password" ? { background: "linear-gradient(135deg,#9A8CF2,#6ED7A5)" } : {}}
                    >
                        Password
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode("otp"); setServerError(""); setOtpError(""); setOtpSent(false); setOtpCode("") }}
                        className={`flex-1 py-2 text-sm font-semibold transition-all duration-200 ${mode === "otp" ? "text-white rounded-xl shadow-sm" : "text-[#6E6B86]"}`}
                        style={mode === "otp" ? { background: "linear-gradient(135deg,#9A8CF2,#6ED7A5)" } : {}}
                    >
                        Email OTP
                    </button>
                </div>

                {/* Password Login */}
                {mode === "password" && (
                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="m@example.com" {...register("email")} aria-invalid={!!errors.email} />
                            {errors.email && <p className="text-sm text-red-400 microcopy">{errors.email.message}</p>}
                        </div>
                        <div className="grid gap-3">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                <Link to="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline text-pink-400">Forgot your password?</Link>
                            </div>
                            <Input id="password" type="password" placeholder="Your password" {...register("password")} aria-invalid={!!errors.password} />
                            {errors.password && <p className="text-sm text-red-400 microcopy">{errors.password.message}</p>}
                        </div>
                        {serverError && <div className="text-sm text-red-400 microcopy">{serverError}</div>}
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? <span className="flex items-center gap-2 justify-center"><LoadingSpinner size="sm" text="" /> Signing in...</span> : "Login"}
                        </Button>
                    </form>
                )}

                {/* OTP Login */}
                {mode === "otp" && (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="otp-email">Email</Label>
                            <Input
                                id="otp-email"
                                type="email"
                                placeholder="m@example.com"
                                value={otpEmail}
                                onChange={e => setOtpEmail(e.target.value)}
                                disabled={otpSent && !otpError}
                            />
                        </div>

                        {!otpSent ? (
                            <>
                                {otpError && <p className="text-sm text-red-400">{otpError}</p>}
                                <Button
                                    type="button"
                                    className="w-full"
                                    onClick={handleSendOtp}
                                    disabled={loading}
                                    style={{ background: "linear-gradient(135deg,#9A8CF2,#6ED7A5)", color: "#fff", border: "none" }}
                                >
                                    {loading ? <span className="flex items-center gap-2 justify-center"><LoadingSpinner size="sm" text="" /> Sending...</span> : "Send OTP Code"}
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="rounded-xl bg-[#F0FDF4] border border-[#6ED7A5]/40 px-4 py-3 text-sm text-[#1C1A2E]">
                                    ✅ Code sent to <strong>{otpEmail}</strong>. Check your inbox.
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="otp-code">6-Digit Code</Label>
                                    <Input
                                        id="otp-code"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="123456"
                                        value={otpCode}
                                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        className="text-center tracking-widest text-lg font-bold"
                                        autoFocus
                                    />
                                </div>
                                {otpError && <p className="text-sm text-red-400">{otpError}</p>}
                                <Button
                                    type="button"
                                    className="w-full"
                                    onClick={handleVerifyOtp}
                                    disabled={loading || otpCode.length < 6}
                                    style={{ background: "linear-gradient(135deg,#9A8CF2,#6ED7A5)", color: "#fff", border: "none" }}
                                >
                                    {loading ? <span className="flex items-center gap-2 justify-center"><LoadingSpinner size="sm" text="" /> Verifying...</span> : "Verify & Sign In"}
                                </Button>
                                <button
                                    type="button"
                                    className="text-sm text-[#9A8CF2] hover:underline text-center"
                                    onClick={() => { setOtpSent(false); setOtpCode(""); setOtpError("") }}
                                >
                                    Resend or change email
                                </button>
                            </>
                        )}
                    </div>
                )}

                <div className="text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link to="/signup" className="underline underline-offset-4 text-pink-400 hover:text-pink-300">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    )
}
