import orchestrator from "../../orchestrator";
import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/user";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createdUser;
  let activationTokenId;
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

    activationTokenId = orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/register/activate/${activationTokenId}`,
    );

    const validToken = await activation.findOneValidById(activationTokenId);

    expect(validToken.user_id).toBe(createdUser.id);
  });

  test("Activate account", async () => {
    const response = await fetch(
      `${webserver.origin}/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(Date.parse(responseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername(createdUser.username);
    expect(activatedUser.features).toEqual(["create:session"]);
  });

  test("Login", async () => {
    const response = await fetch(`${webserver.origin}/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: createdUser.email,
        password: "registrationflowpassword",
      }),
    });

    expect(response.status).toBe(201);

    const responseBody = await response.json();

    expect(responseBody.user_id).toBe(createdUser.id);
  });

  test("Get user information", async () => {});
});
