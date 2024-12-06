import database from "@/infra/database.js";

test("GET to /api/v1/status should return status 200", async () => {
  const result = await database.query("SELECT 1 + 1 as sum;");
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);
});
