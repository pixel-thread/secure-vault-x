type ErrorType = "ERROR" | "WARN" | "INFO" | "LOG";

interface LogPayload {
  type: ErrorType;
  message: string;
  content?: any;
  isBackend?: boolean;
}

const sendLog = async (payload: LogPayload) => {
  try {
    // In a React Native / Expo environment, we use the public API URL
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

    await fetch(`${apiUrl}/api/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        isBackend: false, // Explicitly false for native clients
      }),
    });
  } catch (error) {
    // Fail silently for logger to avoid infinite loops or app crashes
    console.error("[NativeLogger] Failed to send log to backend", error);
  }
};

export const logger = {
  info: (message: string, content?: any) => {
    console.info(message, content);
    sendLog({ type: "INFO", message, content });
  },

  warn: (message: string, content?: any) => {
    console.warn(message, content);
    sendLog({ type: "WARN", message, content });
  },

  error: (message: string, content?: any) => {
    console.error(message, content);
    sendLog({ type: "ERROR", message, content });
  },

  log: (message: string, content?: any) => {
    console.log(message, content);
    sendLog({ type: "LOG", message, content });
  },
};
