import { version as uuidVersion } from "uuid";
import orchestrator from "../../orchestrator";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/notfounduser",
        {
          method: "PATCH",
        },
      );

      expect(response.status).toEqual(404);

      const responseData = await response.json();
      expect(responseData).toEqual({
        action: "Please check the username and try again",
        message: "User not found",
        name: "NotFoundError",
        status_code: 404,
      });
    });

    test("With duplicated username", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      await orchestrator.createUser({
        username: "user2",
      });

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(response.status).toEqual(400);

      const responseData = await response.json();
      expect(responseData).toEqual({
        name: "ValidationError",
        message: "Username already in use",
        status_code: 400,
        action: "Please use a different username",
      });
    });

    test("With duplicated email", async () => {
      await orchestrator.createUser({
        email: "useremail1@example.com",
      });

      const user2 = await orchestrator.createUser({
        email: "useremail2@example.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "useremail1@example.com",
          }),
        },
      );

      expect(response.status).toEqual(400);

      const responseData = await response.json();
      expect(responseData).toEqual({
        name: "ValidationError",
        message: "Email already in use",
        status_code: 400,
        action: "Please use a different email",
      });
    });

    test("With unique username", async () => {
      const user = await orchestrator.createUser({
        username: "userunique1",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/userunique1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "userunique2",
          }),
        },
      );

      expect(response.status).toEqual(200);
      const responseData = await response.json();

      expect(responseData).toEqual({
        id: expect.any(String),
        username: "userunique2",
        email: user.email,
        password: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(uuidVersion(responseData.id)).toBe(4);
      expect(Date.parse(responseData.created_at)).not.toBeNaN();
      expect(Date.parse(responseData.updated_at)).not.toBeNaN();
      expect(responseData.updated_at > responseData.created_at).toBe(true);
    });

    test("With unique email", async () => {
      const user = await orchestrator.createUser({
        email: "uniqueemail1@example.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "uniqueemail2@example.com",
          }),
        },
      );

      expect(response.status).toEqual(200);
      const responseData = await response.json();

      expect(responseData).toEqual({
        id: expect.any(String),
        username: user.username,
        email: "uniqueemail2@example.com",
        password: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(uuidVersion(responseData.id)).toBe(4);
      expect(Date.parse(responseData.created_at)).not.toBeNaN();
      expect(Date.parse(responseData.updated_at)).not.toBeNaN();
      expect(responseData.updated_at > responseData.created_at).toBe(true);
    });

    test("With new password", async () => {
      const userCreated = await orchestrator.createUser({
        password: "password1",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userCreated.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "password2",
          }),
        },
      );

      expect(response.status).toEqual(200);
      const responseData = await response.json();

      expect(responseData).toEqual({
        id: expect.any(String),
        username: userCreated.username,
        email: userCreated.email,
        password: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(uuidVersion(responseData.id)).toBe(4);
      expect(Date.parse(responseData.created_at)).not.toBeNaN();
      expect(Date.parse(responseData.updated_at)).not.toBeNaN();
      expect(responseData.updated_at > responseData.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(userCreated.username);
      const isPasswordCorrect = await password.compare(
        "password2",
        userInDatabase.password,
      );
      expect(isPasswordCorrect).toBe(true);

      const isPasswordIncorrect = await password.compare(
        "password1",
        userInDatabase.password,
      );
      expect(isPasswordIncorrect).toBe(false);
    });
  });
});
