export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequest";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Forbidden";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Conflict";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFound";
  }
}
