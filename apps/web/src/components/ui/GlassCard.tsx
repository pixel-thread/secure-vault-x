import React from "react";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  prominent?: boolean;
  interactive?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className = "",
      prominent = false,
      interactive = false,
      ...props
    },
    ref,
  ) => {
    const baseClass = prominent ? "glass-prominent" : "glass-effect";
    const interactiveClass = interactive
      ? "interactive-glass cursor-pointer"
      : "";

    return (
      <div
        ref={ref}
        className={`${baseClass} ${interactiveClass} rounded-3xl p-6 ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  },
);
GlassCard.displayName = "GlassCard";

export default GlassCard;
