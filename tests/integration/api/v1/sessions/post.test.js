import orchestrator from "../orchestrator";
import session from "models/session";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect email but correct password", async () => {
      await orchestrator.createUser({
        password: "correct-password",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "wrongemail@example.com",
          password: "correct-password",
        }),
      });

      expect(response.status).toEqual(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Invalid email or password",
        status_code: 401,
        action: "Please check your credentials and try again",
      });
    });

    test("With correct email but incorrect password", async () => {
      await orchestrator.createUser({
        email: "correctemail@example.com",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "correctemail@example.com",
          password: "wrong-password",
        }),
      });

      expect(response.status).toEqual(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Invalid email or password",
        status_code: 401,
        action: "Please check your credentials and try again",
      });
    });

    test("With incorrect email but incorrect password", async () => {
      await orchestrator.createUser({});

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "wrongemail@example.com",
          password: "wrong-password",
        }),
      });

      expect(response.status).toEqual(401);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Invalid email or password",
        status_code: 401,
        action: "Please check your credentials and try again",
      });
    });

    test("With correct email but correct password", async () => {
      const user = await orchestrator.createUser({
        email: "allcorrect@example.com",
        password: "allcorrectpassword",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "allcorrect@example.com",
          password: "allcorrectpassword",
        }),
      });

      expect(response.status).toEqual(201);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: expect.any(String),
        token: expect.any(String),
        user_id: user.id,
        created_at: expect.any(String),
        expires_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      const differenceInMilliseconds =
        expiresAt.getTime() - createdAt.getTime();
      expect(differenceInMilliseconds).toBe(session.EXPIRATION_IN_MILLISECONDS);

      const parsedSetCookie = setCookieParser(response, { map: true });
      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: responseBody.token,
        path: "/",
        httpOnly: true,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
      });
    });
  });
});
