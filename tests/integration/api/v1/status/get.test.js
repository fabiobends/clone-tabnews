test("GET to /api/v1/status should return status 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  const data = await response.json();
  expect(data.updated_at).toBeDefined();
  const parsedDate = new Date(data.updated_at).toISOString();
  expect(data.updated_at).toEqual(parsedDate);
  expect(parseInt(data.dependencies.database.version)).toEqual(16);
  expect(data.dependencies.database.max_connections).toEqual(100);
  expect(data.dependencies.database.opened_connections).toEqual(1);
});
