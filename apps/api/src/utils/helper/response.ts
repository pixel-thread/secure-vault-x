import { Context } from "hono";
import { MetaT } from "@securevault/types";
import { ContentfulStatusCode } from "hono/utils/http-status";

interface ResponseProps<T> {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: MetaT;
  status?: ContentfulStatusCode;
  error?: T;
}

/**
 * Sends a structured JSON response following the project's standards.
 * @param c Hono Context
 * @param props Response properties (success, message, data, status, meta, token)
 */

export const sendResponse = <T>(
  c: Context,
  {
    success = true,
    message = "Request successful",
    data,
    status = 200,
    meta,
    error,
  }: ResponseProps<T>,
) => {
  return c.json(
    {
      success,
      message,
      data,
      error,
      meta,
      timeStamp: new Date().toISOString(),
    },
    status,
    {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  );
};

export const successResponse = <T>(c: Context, props: ResponseProps<T>) => {
  return sendResponse(c, { ...props, success: true });
};

export const errorResponse = <T>(c: Context, props: ResponseProps<T>) => {
  return sendResponse(c, {
    ...props,
    success: false,
    status: props.status || 400,
  });
};
