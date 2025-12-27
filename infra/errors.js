export class InternalServerError extends Error {
  constructor({ cause }) {
    super("Something went wrong", { cause });
    this.name = "InternalServerError";
    this.statusCode = 500;
    this.action =
      "Please try again later or contact support if the issue persists.";
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
