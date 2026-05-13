import orchestrator from "../../../../orchestrator";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("PATCH /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieves pending migrations", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/migrations`, {
        method: "PATCH",
      });
      expect(response.status).toEqual(405);
    });
  });
});
