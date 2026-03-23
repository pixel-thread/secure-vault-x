type ErrorType = "ERROR" | "WARN" | "INFO" | "LOG";

interface LogPayload {
  type: ErrorType;
  message: string;
  content?: any;
  timestamp: number;
}

const SENSITIVE_FIELDS = [
  "password",
  "secret",
  "token",
  "userId",
  "mnemonic",
  "privateKey",
  "seed",
  "iv",
  "encryptedData",
  "email",
  "cardNumber",
  "cvv",
];

const maskSensitiveData = (data: any): any => {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const masked: any = {};
  for (const key in data) {
    if (
      SENSITIVE_FIELDS.some((field) =>
        key.toLowerCase().includes(field.toLowerCase()),
      )
    ) {
      masked[key] = "[MASKED]";
    } else if (typeof data[key] === "object") {
      masked[key] = maskSensitiveData(data[key]);
    } else {
      masked[key] = data[key];
    }
  }
  return masked;
};

let logQueue: LogPayload[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const MAX_BATCH_SIZE = 20;
const BATCH_INTERVAL = 5000; // 5 seconds

const flushLogs = async (retryCount = 0) => {
  if (logQueue.length === 0) return;

  const batch = [...logQueue];
  logQueue = [];
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
    const response = await fetch(`${apiUrl}/api/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        logs: batch,
        isBackend: false,
        message: "Logging from mobile device",
      }),
    });

    if (!response.ok && retryCount < 1) {
      console.log("[NativeLogger] HTTP Error, retrying...", response.status);
      logQueue = [...batch, ...logQueue];
      await flushLogs(retryCount + 1);
    }
  } catch (error) {
    console.log("[NativeLogger] Failed to flush logs", error);
    if (retryCount < 1) {
      logQueue = [...batch, ...logQueue];
      // Retry after a delay
      setTimeout(() => flushLogs(retryCount + 1), 2000);
    }
  }
};

const sendLog = (payload: Omit<LogPayload, "timestamp">) => {
  if (payload.type === "LOG") return;

  const maskedContent = payload.content
    ? maskSensitiveData(payload.content)
    : undefined;
  const maskedMessage = payload.message; // Messages should ideally be static, but we can't easily mask them without regex

  logQueue.push({
    ...payload,
    message: maskedMessage,
    content: maskedContent,
    timestamp: Date.now(),
  });

  if (logQueue.length >= MAX_BATCH_SIZE) {
    flushLogs();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(flushLogs, BATCH_INTERVAL);
  }
};

const logLocally = (message: string, content?: any) => {
  if (process.env.NODE_ENV === "development") {
    if (content) {
      console.log(
        `[${new Date().toISOString()}] ${message}`,
        JSON.stringify(content, null, 2),
      );
    } else {
      console.log(`[${new Date().toISOString()}] ${message}`);
    }
  }
};

export const logger = {
  info: (message: string, content?: any) => {
    logLocally(message, content);
    sendLog({ type: "INFO", message, content });
  },

  warn: (message: string, content?: any) => {
    logLocally(message, content);
    sendLog({ type: "WARN", message, content });
  },

  error: (message: string, content?: any) => {
    logLocally(message, content);
    sendLog({ type: "ERROR", message, content });
  },

  log: (message: string, content?: any) => {
    logLocally(message, content);
  },
};
