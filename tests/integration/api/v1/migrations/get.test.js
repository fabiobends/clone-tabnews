import orchestrator from "../../../../orchestrator";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieves pending migrations", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/migrations`);
      const data = await response.json();
      expect(response.status).toEqual(403);
      expect(data).toEqual({
        action: "Verify if your account owns this action: read:migration",
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieves pending migrations", async () => {
      const user = await orchestrator.createUser({});
      await orchestrator.activateUser(user);
      const session = await orchestrator.createSession(user.id);
      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        headers: {
          cookie: `session_id=${session.token}`,
        },
      });
      const data = await response.json();
      expect(response.status).toEqual(403);
      expect(data).toEqual({
        action: "Verify if your account owns this action: read:migration",
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("Retrieves pending migrations", async () => {
      const user = await orchestrator.createUser({});
      await orchestrator.activateUser(user);
      await orchestrator.addFeaturesToUser(user, ["read:migration"]);
      const session = await orchestrator.createSession(user.id);
      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        headers: {
          cookie: `session_id=${session.token}`,
        },
      });
      const data = await response.json();
      expect(response.status).toEqual(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });
});
