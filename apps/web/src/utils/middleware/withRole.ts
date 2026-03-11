import { NextRequest } from "next/server";
import { UnauthorizedError } from "../errors/unAuthError";
import { AuthService } from "@/services/auth.service";

const ROLE_HIERARCHY = {
  NONE: 0,
  USER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
} as const;

type Role = keyof typeof ROLE_HIERARCHY;

async function requiredAuth(req: NextRequest) {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  return { userId };
}

export async function withRole(req: NextRequest, requiredRole: Role) {
  // 1. If the requirement is NONE, we don't even need to check auth
  if (requiredRole === "NONE") {
    return null; // Or return a mock auth object
  }
  const user = await requiredAuth(req);
  // 2. Otherwise, perform the authentication check
  const auth = await AuthService.getMe(user.userId);

  const userRoleValue = ROLE_HIERARCHY[auth.role as Role] || 0;

  const requiredRoleValue = ROLE_HIERARCHY[requiredRole];

  if (userRoleValue < requiredRoleValue) {
    throw new UnauthorizedError(
      `Access denied. This action requires ${requiredRole} or higher.`,
    );
  }

  return auth as Required<typeof auth>;
}
