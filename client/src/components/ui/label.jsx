import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
  "flex items-center gap-2 text-sm leading-none font-bold select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 bg-gradient-to-r from-lavender via-pink-500 to-[color:var(--primary)] bg-clip-text text-transparent hover:text-shadow-glow transition-all cursor-pointer",
        className
      )}
      {...props} />
  );
}

export { Label }
