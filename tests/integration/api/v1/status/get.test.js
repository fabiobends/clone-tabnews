import orchestrator from "../../../../orchestrator";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieves current sytem status", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/status`);
      const data = await response.json();
      expect(response.status).toEqual(200);
      expect(data.updated_at).toBeDefined();
      const parsedDate = new Date(data.updated_at).toISOString();
      expect(data.updated_at).toEqual(parsedDate);
      expect(data.dependencies.database).not.toHaveProperty("version");
      expect(data.dependencies.database.max_connections).toEqual(100);
      expect(data.dependencies.database.opened_connections).toEqual(1);
    });
  });

  describe("Default user", () => {
    test("Retrieves current sytem status", async () => {
      const user = await orchestrator.createUser({});
      await orchestrator.activateUser(user);
      const session = await orchestrator.createSession(user);
      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          cookie: `session_id=${session.token}`,
        },
      });
      const data = await response.json();
      expect(response.status).toEqual(200);
      expect(data.updated_at).toBeDefined();
      const parsedDate = new Date(data.updated_at).toISOString();
      expect(data.updated_at).toEqual(parsedDate);
      expect(data.dependencies.database).not.toHaveProperty("version");
      expect(data.dependencies.database.max_connections).toEqual(100);
      expect(data.dependencies.database.opened_connections).toEqual(1);
    });
  });

  describe("Privileged user", () => {
    test("Retrieves current sytem status without database version", async () => {
      const user = await orchestrator.createUser({});
      await orchestrator.activateUser(user);
      await orchestrator.addFeaturesToUser(user, ["read:status"]);
      const session = await orchestrator.createSession(user);
      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          cookie: `session_id=${session.token}`,
        },
      });
      const data = await response.json();
      expect(response.status).toEqual(200);
      expect(data.updated_at).toBeDefined();
      const parsedDate = new Date(data.updated_at).toISOString();
      expect(data.updated_at).toEqual(parsedDate);
      expect(data.dependencies.database).not.toHaveProperty("version");
      expect(data.dependencies.database.max_connections).toEqual(100);
      expect(data.dependencies.database.opened_connections).toEqual(1);
    });

    test("Retrieves current sytem status all info", async () => {
      const user = await orchestrator.createUser({});
      await orchestrator.activateUser(user);
      await orchestrator.addFeaturesToUser(user, ["read:status:all"]);
      const session = await orchestrator.createSession(user);
      const response = await fetch(`${webserver.origin}/api/v1/status`, {
        headers: {
          cookie: `session_id=${session.token}`,
        },
      });
      const data = await response.json();
      expect(response.status).toEqual(200);
      expect(data.updated_at).toBeDefined();
      const parsedDate = new Date(data.updated_at).toISOString();
      expect(data.updated_at).toEqual(parsedDate);
      expect(parseInt(data.dependencies.database.version)).toEqual(16);
      expect(data.dependencies.database.max_connections).toEqual(100);
      expect(data.dependencies.database.opened_connections).toEqual(1);
    });
  });
});
