import orchestrator from "../orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieves current sytem status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "POST",
      });
      const data = await response.json();
      expect(response.status).toEqual(405);

      expect(data).toMatchObject({
        name: "MethodNotAllowedError",
        message: "Method not allowed for this endpoint",
        action: "Please check allowed methods for this endpoint",
        status_code: 405,
      });
    });
  });
});
