import { $Enums } from "@/libs/db/prisma/generated/prisma";
import { prisma } from "@libs/db/prisma";

export class LoggerService {
  static async log(params: {
    type: $Enums.ErrorType;
    message: string;
    content: string;
    isBackend?: boolean;
  }) {
    try {
      await prisma.log.create({
        data: {
          type: params.type,
          message: params.message,
          content: JSON.stringify(params.content),
          isBackend: params.isBackend,
        },
      });
    } catch (error) {
      // Don't let audit logging failure block the main operation
      console.error("[Logger] Failed to create audit log:", error);
    }
  }
}
