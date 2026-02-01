import { version as uuidVersion } from "uuid";
import orchestrator from "../orchestrator";
import session from "models/session";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const user = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const sessionCreated = await orchestrator.createSession(user.id);

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${sessionCreated.token}`,
        },
      });

      expect(response.status).toEqual(200);

      const responseData = await response.json();
      expect(responseData).toEqual({
        id: sessionCreated.id,
        user_id: sessionCreated.user_id,
        token: sessionCreated.token,
        created_at: responseData.created_at,
        updated_at: responseData.updated_at,
        expires_at: responseData.expires_at,
      });

      expect(uuidVersion(responseData.id)).toBe(4);
      expect(Date.parse(responseData.created_at)).not.toBeNaN();
      expect(Date.parse(responseData.updated_at)).not.toBeNaN();

      // Renewed session checks
      expect(
        new Date(responseData.expires_at) < new Date(sessionCreated.expires_at),
      ).toBe(true);
      expect(
        new Date(responseData.updated_at) > new Date(sessionCreated.updated_at),
      ).toBe(true);

      // Set-Cookie header check
      const parsedSetCookie = setCookieParser(response, { map: true });
      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        path: "/",
        httpOnly: true,
        maxAge: -1,
      });

      // Double check assertions
      const doubleCheckResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionCreated.token}`,
          },
        },
      );

      expect(doubleCheckResponse.status).toEqual(401);
      const doubleCheckResponseData = await doubleCheckResponse.json();
      expect(doubleCheckResponseData).toEqual({
        name: "UnauthorizedError",
        message: "Invalid session",
        status_code: 401,
        action: "Please log in and try again",
      });
    });

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "438e105ea82f899ed5c9d3bca8a0ac38fbc5197df48c17850f71c781ec74c714a973e3c99802c24efa2a598820fff55b";

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
        },
      });

      expect(response.status).toEqual(401);
      const responseData = await response.json();
      expect(responseData).toEqual({
        name: "UnauthorizedError",
        message: "Invalid session",
        status_code: 401,
        action: "Please log in and try again",
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const user = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const sessionCreated = await orchestrator.createSession(user.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${sessionCreated.token}`,
        },
      });

      expect(response.status).toEqual(401);
      const responseData = await response.json();
      expect(responseData).toEqual({
        name: "UnauthorizedError",
        message: "Invalid session",
        status_code: 401,
        action: "Please log in and try again",
      });
    });
  });
});
