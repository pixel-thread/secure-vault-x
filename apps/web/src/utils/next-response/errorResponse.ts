import { NextResponse } from "next/server";
// Removed axios import to avoid module load failure in middleware

interface Props<T> {
  message?: string;
  error?: T | unknown | null;
  status?: number;
  data?: T | unknown | null;
}

export const ErrorResponse = <T>({ message = "Unknown error", error, status = 500 }: Props<T>) => {
  return NextResponse.json(
    {
      success: false,
      message: message || "Unknown error",
      error: error,
      timeStamp: new Date().toISOString(),
    },
    { status: status }
  );
};
