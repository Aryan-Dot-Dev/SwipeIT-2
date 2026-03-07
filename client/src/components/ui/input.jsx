import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "glass-input file:text-foreground placeholder:text-muted-foreground flex h-10 w-full min-w-0 rounded-md border-2 border-purple-300 bg-white px-3 py-2 text-base shadow-sm transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 md:text-sm",
        "hover:border-purple-400",
        "focus-visible:border-purple-600 focus-visible:ring-purple-500/20 focus-visible:ring-[3px] focus-visible:bg-white",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props} />
  );
}

export { Input }
