import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:brightness-95",
        destructive: "bg-[color:var(--destructive)] text-white hover:brightness-95",
        outline: "border border-[color:var(--border)] bg-[color:var(--background)] hover:bg-[color:var(--muted)]",
        secondary: "bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] hover:brightness-95",
        ghost: "hover:bg-[color:var(--muted)]",
        link: "underline-offset-4 hover:underline text-[color:var(--primary)]",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button }
