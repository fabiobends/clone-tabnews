import database from "infra/database";

async function cleanDatabase() {
  await database.query("DROP SCHEMA public cascade; CREATE SCHEMA public;");
}

beforeAll(cleanDatabase);

test("POST to /api/v1/migrations should return status 200", async () => {
  const firstResponse = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  const pendingMigrations = await firstResponse.json();
  expect(firstResponse.status).toEqual(201);
  expect(Array.isArray(pendingMigrations)).toBe(true);
  expect(pendingMigrations.length).toBeGreaterThan(0);

  const secondResponse = await fetch(
    "http://localhost:3000/api/v1/migrations",
    {
      method: "POST",
    },
  );
  const migratedMigrations = await secondResponse.json();
  expect(secondResponse.status).toEqual(200);
  expect(migratedMigrations.length).toEqual(0);
});
