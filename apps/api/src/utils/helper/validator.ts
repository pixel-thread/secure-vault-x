import { Hook } from "@hono/zod-validator";
import { Context } from "hono";

export const validatorHook: Hook<any, any, any, any> = (result, c: Context) => {
  if (!result.success) {
    throw (result as { error: unknown }).error;
  }
};
