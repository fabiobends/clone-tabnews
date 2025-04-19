import orchestrator from "../orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieves current sytem status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");
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
