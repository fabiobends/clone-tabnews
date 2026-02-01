import { version as uuidVersion } from "uuid";
import orchestrator from "../orchestrator";
import session from "models/session";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const user = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const sessionCreated = await orchestrator.createSession(user.id);

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionCreated.token}`,
        },
      });

      expect(response.status).toEqual(200);

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const responseData = await response.json();
      expect(responseData).toEqual({
        id: expect.any(String),
        username: "UserWithValidSession",
        email: user.email,
        password: user.password,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
      });

      expect(uuidVersion(responseData.id)).toBe(4);
      expect(Date.parse(responseData.created_at)).not.toBeNaN();
      expect(Date.parse(responseData.updated_at)).not.toBeNaN();

      // Renewed session checks
      const renewedSession = await session.findOneValidSessionByToken(
        sessionCreated.token,
      );
      expect(renewedSession.expires_at > sessionCreated.expires_at).toBe(true);
      expect(renewedSession.updated_at > sessionCreated.updated_at).toBe(true);

      // Set-Cookie header check
      const parsedSetCookie = setCookieParser(response, { map: true });
      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionCreated.token,
        path: "/",
        httpOnly: true,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
      });
    });

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "438e105ea82f899ed5c9d3bca8a0ac38fbc5197df48c17850f71c781ec74c714a973e3c99802c24efa2a598820fff55b";

      const response = await fetch("http://localhost:3000/api/v1/user", {
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

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
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

      const response = await fetch("http://localhost:3000/api/v1/user", {
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

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });

    test("With almost expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS + 1000),
      });

      const user = await orchestrator.createUser({
        username: "UserWithAlmostExpiredSession",
      });

      const sessionCreated = await orchestrator.createSession(user.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionCreated.token}`,
        },
      });

      expect(response.status).toEqual(200);
      const responseData = await response.json();
      expect(responseData).toEqual({
        id: expect.any(String),
        username: "UserWithAlmostExpiredSession",
        email: user.email,
        password: user.password,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
      });

      expect(uuidVersion(responseData.id)).toBe(4);
      expect(Date.parse(responseData.created_at)).not.toBeNaN();
      expect(Date.parse(responseData.updated_at)).not.toBeNaN();

      // Renewed session checks
      const renewedSession = await session.findOneValidSessionByToken(
        sessionCreated.token,
      );
      expect(renewedSession.expires_at > sessionCreated.expires_at).toBe(true);
      expect(renewedSession.updated_at > sessionCreated.updated_at).toBe(true);
    });
  });
});
