import z from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/\d/, "Must contain a number")
  .regex(/[@$!%*?&]/, "Must contain a special character");

export const logSchema = z.object({
  type: z.enum(["ERROR", "WARN", "INFO", "LOG"]).optional(),
  message: z.string().optional(),
  content: z.any().optional(),
  isBackend: z.boolean().default(false),
  logs: z
    .array(
      z.object({
        type: z.enum(["ERROR", "WARN", "INFO", "LOG"]),
        message: z.string().min(1, "Message is required"),
        content: z.any().optional(),
        timestamp: z.number().optional(),
      }),
    )
    .optional(),
});
