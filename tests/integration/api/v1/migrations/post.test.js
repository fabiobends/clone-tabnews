import orchestrator from "../../../../orchestrator";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Runs pending migrations", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: "POST",
      });
      const responseBody = await response.json();
      expect(response.status).toEqual(403);
      expect(responseBody).toEqual({
        action: "Verify if your account owns this action: create:migration",
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Runs pending migrations", async () => {
      const user = await orchestrator.createUser({});
      await orchestrator.activateUser(user);
      const session = await orchestrator.createSession(user.id);
      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: "POST",
        headers: {
          cookie: `session_id=${session.token}`,
        },
      });
      const responseBody = await response.json();
      expect(response.status).toEqual(403);
      expect(responseBody).toEqual({
        action: "Verify if your account owns this action: create:migration",
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("Runs pending migrations", async () => {
      const user = await orchestrator.createUser({});
      await orchestrator.activateUser(user);
      await orchestrator.addFeaturesToUser(user, ["create:migration"]);
      const session = await orchestrator.createSession(user.id);

      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: "POST",
        headers: {
          cookie: `session_id=${session.token}`,
        },
      });
      const responseBody = await response.json();
      expect(response.status).toEqual(200);
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBe(0);
    });
  });
});
