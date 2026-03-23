import * as React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const textVariants = cva("text-foreground", {
  variants: {
    variant: {
      default: "text-base",
      h1: "text-4xl font-bold tracking-tight",
      h2: "text-3xl font-semibold tracking-tight",
      h3: "text-2xl font-semibold tracking-tight",
      h4: "text-xl font-semibold tracking-tight",
      p: "text-base leading-7",
      blockquote: "border-l-2 border-muted pl-6 italic",
      ul: "my-6 ml-6 list-disc [&>li]:mt-2",
      inlineCode:
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
      lead: "text-xl text-muted-foreground",
      large: "text-lg font-semibold",
      small: "text-sm font-medium leading-none",
      muted: "text-sm text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface TextProps
  extends RNTextProps, VariantProps<typeof textVariants> {
  className?: string;
}

const Text = React.forwardRef<RNText, TextProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <RNText
        ref={ref}
        className={cn(textVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
Text.displayName = "Text";

export { Text, textVariants };
