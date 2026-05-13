import orchestrator from "../../../../../orchestrator";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With any token", async () => {
      const response = await fetch(
        `${webserver.origin}/api/v1/activations/sometoken`,
      );

      expect(response.status).toEqual(405);

      const responseData = await response.json();
      expect(responseData).toEqual({
        name: "MethodNotAllowedError",
        message: "Method not allowed for this endpoint",
        action: "Please check allowed methods for this endpoint",
        status_code: 405,
      });
    });
  });

  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({});
      await orchestrator.activateUser(createdUser);
      const userSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/sometoken`,
        {
          headers: {
            Cookie: `session_id=${userSession.token}`,
          },
        },
      );

      expect(response.status).toEqual(405);

      const responseData = await response.json();
      expect(responseData).toEqual({
        name: "MethodNotAllowedError",
        message: "Method not allowed for this endpoint",
        action: "Please check allowed methods for this endpoint",
        status_code: 405,
      });
    });
  });
});
