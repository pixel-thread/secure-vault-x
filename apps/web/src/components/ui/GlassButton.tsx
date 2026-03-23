import React from "react";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "prominent";
}

export const GlassButton = React.forwardRef<
  HTMLButtonElement,
  GlassButtonProps
>(({ children, className = "", variant = "default", ...props }, ref) => {
  const baseClass =
    variant === "prominent"
      ? "glass-prominent text-emerald-500"
      : "glass-effect";

  return (
    <button
      ref={ref}
      className={`${baseClass} interactive-glass rounded-2xl px-6 py-3 font-semibold transition-all flex items-center justify-center gap-2 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
});
GlassButton.displayName = "GlassButton";

export default GlassButton;
