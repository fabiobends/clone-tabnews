import database from "infra/database";
import { waitForAllServices } from "../orchestrator";

async function cleanDatabase() {
  await database.query("DROP SCHEMA public cascade; CREATE SCHEMA public;");
}

beforeAll(async () => {
  await waitForAllServices();
  await cleanDatabase();
});

test("GET to /api/v1/migrations should return status 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations");
  const data = await response.json();
  expect(response.status).toEqual(200);
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
});
