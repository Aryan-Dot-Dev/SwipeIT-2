// ...existing code...
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { login, waitForAuthChange } from "../api/auth.api"
 
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
                // wait for cookies/auth to be written and auth:changed to fire
                try { await waitForAuthChange(prevToken, 2500) } catch { /* ignore */ }
                navigate("/dashboard")
            }
        } catch (error) {
            setServerError(error?.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }
 
    return (
        <form onSubmit={handleSubmit(onSubmit)} className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Login to your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                    Enter your email below to login to your account
                </p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" {...register("email")} aria-invalid={!!errors.email} />
                    {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>
                <div className="grid gap-3">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        <Link to="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">Forgot your password?</Link>
                    </div>
                    <Input id="password" type="password" {...register("password")} aria-invalid={!!errors.password} />
                    {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                </div>
                {serverError && <div className="text-sm text-red-600">{serverError}</div>}
                <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </Button>
            </div>
            <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="underline underline-offset-4">
                    Sign up
                </Link>
            </div>
        </form>
    )
}
