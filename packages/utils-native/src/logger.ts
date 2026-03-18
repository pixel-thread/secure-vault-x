type ErrorType = "ERROR" | "WARN" | "INFO" | "LOG";

interface LogPayload {
  type: ErrorType;
  message: string;
  content?: any;
  timestamp: number;
}

let logQueue: LogPayload[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const MAX_BATCH_SIZE = 20;
const BATCH_INTERVAL = 5000; // 5 seconds

const flushLogs = async () => {
  if (logQueue.length === 0) return;

  const batch = [...logQueue];
  logQueue = [];
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
    await fetch(`${apiUrl}/api/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        logs: batch,
        isBackend: false,
      }),
    });
  } catch (error) {
    console.log("[NativeLogger] Failed to flush logs", error);
    // Silent fail to avoid infinite loops
  }
};

const sendLog = (payload: Omit<LogPayload, 'timestamp'>) => {
  if (payload.type === "LOG") return;

  logQueue.push({
    ...payload,
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
    console.log(message, content);
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
