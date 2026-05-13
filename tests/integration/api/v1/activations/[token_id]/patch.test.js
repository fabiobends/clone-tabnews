import orchestrator from "../../../../../orchestrator";
import activation from "models/activation";
import user from "models/user";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent token", async () => {
      const response = await fetch(
        `${webserver.origin}/api/v1/activations/eff4c9b0-1234-5678-9012-abcdef123456`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toEqual(404);

      const responseData = await response.json();
      expect(responseData).toEqual({
        name: "NotFoundError",
        message: "Activation token not found or invalid",
        action: "Verify if the token is correct or contact support",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({});
      const activationToken = await activation.create(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toEqual(404);

      const responseData = await response.json();
      expect(responseData).toEqual({
        name: "NotFoundError",
        message: "Activation token not found or invalid",
        action: "Verify if the token is correct or contact support",
        status_code: 404,
      });
    });

    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser({});
      const activationToken = await activation.create(createdUser.id);

      jest.useRealTimers();

      const response1 = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response1.status).toEqual(200);

      const response2 = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response2.status).toEqual(404);

      const responseData = await response2.json();
      expect(responseData).toEqual({
        name: "NotFoundError",
        message: "Activation token not found or invalid",
        action: "Verify if the token is correct or contact support",
        status_code: 404,
      });
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser({});
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toEqual(200);

      const responseData = await response.json();
      expect(responseData).toEqual({
        id: activationToken.id,
        user_id: createdUser.id,
        expires_at: expect.any(String),
        used_at: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      const activatedUser = await user.findOneByUsername(createdUser.username);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
        "update:user",
      ]);
    });

    test("With valid token but already activated user", async () => {
      const createdUser = await orchestrator.createUser({});
      await orchestrator.activateUser(createdUser);
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toEqual(403);

      const responseData = await response.json();
      expect(responseData).toEqual({
        name: "ForbiddenError",
        action: "Contact support if you believe this is an error.",
        message: "You do not have permission to activate this user.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With valid token, but already logged in", async () => {
      const user1 = await orchestrator.createUser({});
      await orchestrator.activateUser(user1);
      const user1Session = await orchestrator.createSession(user1);

      const user2 = await orchestrator.createUser({});
      const user2ActivationToken = await activation.create(user2.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${user1Session.token}`,
          },
        },
      );

      expect(response.status).toEqual(403);

      const responseData = await response.json();
      expect(responseData).toEqual({
        name: "ForbiddenError",
        message: "You don't have permission to execute this action",
        action:
          "Verify if your account owns this action: read:activation_token",
        status_code: 403,
      });
    });
  });
});
