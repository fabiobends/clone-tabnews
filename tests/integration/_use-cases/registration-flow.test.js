import orchestrator from "../../orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  test("Create user account", async () => {
    const response = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "RegisttrationFlow",
        email: "registration.flow@example.com",
        password: "registrationflowpassword",
      }),
    });

    expect(response.status).toEqual(201);

    const responseData = await response.json();
    expect(responseData).toEqual({
      id: expect.any(String),
      username: "RegisttrationFlow",
      email: "registration.flow@example.com",
      features: ["read:activation_token"],
      password: expect.any(String),
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  test("Receive activation email", async () => {});

  test("Activate account", async () => {});

  test("Login", async () => {});

  test("Get user information", async () => {});
});
