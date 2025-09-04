// ...existing code...
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
// import api from "@/lib/api"
import { signup } from "../api/auth.api"

const schema = yup.object({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Enter a valid email").required("Email is required"),
    password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
    confirmPassword: yup.string().oneOf([yup.ref("password")], "Passwords must match").required("Confirm your password"),
    role: yup.string().oneOf(["recruiter", "candidate"], "Select a role").required("Role is required")
}).required()

export function SignupForm({
    className,
    ...props
}) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState("")

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    })
    const roleValue = watch("role")

    const onSubmit = async (data) => {
        setServerError("")
        setLoading(true)
        try {
            // auth.api.signup(email, password, role, name, phone)
            const res = await signup(data.email, data.password, data.role, data.name)
            if (!res) {
                setServerError("Signup failed")
            } else if (res.error) {
                setServerError(res.error)
            } else if (res.session) {
                // persist chosen onboarding role so the onboarding wrapper loads the correct flow
                try {
                    if (data.role) localStorage.setItem('onboarding_role', data.role)
                    // persist name/email so onboarding can attach recruiter profile data
                    if (data.name) localStorage.setItem('signup_name', data.name)
                    if (data.email) localStorage.setItem('signup_email', data.email)
                } catch { /* ignore */ }
                navigate("/onboarding")
            } else if (res.profile) {
                navigate("/login")
            } else {
                navigate("/login")
            }
        } catch (error) {
            setServerError("Signup failed", error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={cn("flex flex-col gap-4", className)} {...props}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-sm text-balance">Enter your details below to sign up</p>
            </div>
            <div className="grid gap-4">
                <div className="grid gap-3">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" type="text" placeholder="Your full name" {...register("name")} aria-invalid={!!errors.name} />
                    {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" {...register("email")} aria-invalid={!!errors.email} />
                    {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" {...register("password")} aria-invalid={!!errors.password} />
                    {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword} />
                    {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
                </div>
                <div className="grid gap-3">
                    <Label className="mb-1">Proceed as</Label>
                    <div className="flex gap-2">
                        <label className={["cursor-pointer flex-1 rounded-md py-2 px-4 text-center border", roleValue === 'recruiter' ? 'text-[color:var(--primary-foreground)] border-[color:var(--primary)]' : 'text-[color:var(--secondary-foreground)] border-[color:var(--secondary)]'].join(' ')} style={ roleValue === 'recruiter' ? { background: 'var(--primary)' } : { background: 'var(--secondary)' }}>
                            <input type="radio" {...register("role")} value="recruiter" className="sr-only" />
                            Recruiter
                        </label>
                        <label className={["cursor-pointer flex-1 rounded-md py-2 px-4 text-center border", roleValue === 'candidate' ? 'text-[color:var(--primary-foreground)] border-[color:var(--primary)]' : 'text-[color:var(--secondary-foreground)] border-[color:var(--secondary)]'].join(' ')} style={ roleValue === 'candidate' ? { background: 'var(--primary)' } : { background: 'var(--secondary)' }}>
                            <input type="radio" {...register("role")} value="candidate" className="sr-only" />
                            Candidate
                        </label>
                    </div>
                    {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
                </div>
                {serverError && <div className="text-sm text-red-600">{serverError}</div>}
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</Button>
            </div>
            <div className="text-center text-sm">
                Already have an account?{" "}
                <Link to="/login" className="underline underline-offset-4">Login</Link>
            </div>
        </form>
    )
}
