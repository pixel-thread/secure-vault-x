export class UnauthorizedError extends Error {
  public readonly status = 401; // Explicitly mark as readonly

  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError"; // Match class name for clarity
  }
}
