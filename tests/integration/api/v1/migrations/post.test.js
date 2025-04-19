import orchestrator from "../orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Runs pending migrations", () => {
      test("For the first time", async () => {
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );
        const pendingMigrations = await response.json();
        expect(response.status).toEqual(201);
        expect(Array.isArray(pendingMigrations)).toBe(true);
        expect(pendingMigrations.length).toBeGreaterThan(0);
      });
      test("For the second time", async () => {
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );
        const pendingMigrations = await response.json();
        expect(response.status).toEqual(200);
        expect(Array.isArray(pendingMigrations)).toBe(true);
        expect(pendingMigrations.length).toBe(0);
      });
    });
  });
});
