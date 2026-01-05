export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Something went wrong", { cause });
    this.name = "InternalServerError";
    this.statusCode = statusCode || 500;
    this.action =
      "Please try again later or contact support if the issue persists";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status_code: this.statusCode,
      action: this.action,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "Service unavailable", { cause });
    this.name = "ServiceError";
    this.statusCode = 503;
    this.action = "Please verify if service is available and try again";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status_code: this.statusCode,
      action: this.action,
    };
  }
}

export class BadRequestError extends Error {
  constructor({ message }) {
    super(message || "Bad request");
    this.name = "BadRequestError";
    this.statusCode = 400;
    this.action = "Please check request data and try again";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status_code: this.statusCode,
      action: this.action,
    };
  }
}

export class ValidationError extends BadRequestError {
  constructor({ message, action }) {
    super({ message });
    this.name = "ValidationError";
    this.action = action || "Please check request data for validation errors";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status_code: this.statusCode,
      action: this.action,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Method not allowed for this endpoint");
    this.name = "MethodNotAllowedError";
    this.statusCode = 405;
    this.action = "Please check allowed methods for this endpoint";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status_code: this.statusCode,
      action: this.action,
    };
  }
}
