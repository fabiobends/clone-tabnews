import orchestrator from "../../orchestrator";
import webserver from "infra/webserver";
import activation from "models/activation";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createdUser;
  test("Create user account", async () => {
    const response = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "RegistrationFlow",
        email: "registration.flow@example.com",
        password: "registrationflowpassword",
      }),
    });

    expect(response.status).toEqual(201);

    createdUser = await response.json();
    expect(createdUser).toEqual({
      id: expect.any(String),
      username: "RegistrationFlow",
      email: "registration.flow@example.com",
      features: ["read:activation_token"],
      password: expect.any(String),
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contact@example.com>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@example.com>");
    expect(lastEmail.subject).toBe("Activate your account");
    expect(lastEmail.text).toContain("RegistrationFlow");

    const token = orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/register/activate/${token}`,
    );

    const validToken = await activation.findOneValidById(token);

    expect(validToken.user_id).toBe(createdUser.id);
  });

  test("Activate account", async () => {});

  test("Login", async () => {});

  test("Get user information", async () => {});
});
