import { version as uuidVersion } from "uuid";
import orchestrator from "../../../../../orchestrator";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique username", async () => {
      await orchestrator.createUser({
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

      expect(response.status).toEqual(403);
      const responseData = await response.json();

      expect(responseData).toEqual({
        action: "Verify if your account owns this action: update:user",
        message: "You don't have permission to execute this action",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent username", async () => {
      const createdUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(createdUser);
      const userSession = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/notfounduser",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${userSession.token}`,
          },
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

      const user2Created = await orchestrator.createUser({
        username: "user2",
      });

      const user2Activated = await orchestrator.activateUser(user2Created);
      const user2Session = await orchestrator.createSession(user2Activated.id);

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: `session_id=${user2Session.token}`,
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

      const user2Created = await orchestrator.createUser({
        email: "useremail2@example.com",
      });

      const user2Activated = await orchestrator.activateUser(user2Created);
      const user2Session = await orchestrator.createSession(user2Activated.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user2Created.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${user2Session.token}`,
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

    test("With userB targeting userA", async () => {
      const userA = await orchestrator.createUser({
        username: "userA",
      });

      const userB = await orchestrator.createUser({
        username: "userB",
      });

      const userBActivated = await orchestrator.activateUser(userB);
      const userBSession = await orchestrator.createSession(userBActivated.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userA.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${userBSession.token}`,
          },
          body: JSON.stringify({
            username: "userC",
          }),
        },
      );

      expect(response.status).toEqual(403);

      const responseData = await response.json();
      expect(responseData).toEqual({
        action: "Verify if you own the feature to update others users.",
        message: "You do not have permission to update this user.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("With unique username", async () => {
      const user = await orchestrator.createUser({
        username: "useruniquy1",
      });

      const userActivated = await orchestrator.activateUser(user);
      const userSession = await orchestrator.createSession(userActivated.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/useruniquy1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${userSession.token}`,
          },
          body: JSON.stringify({
            username: "useruniquy2",
          }),
        },
      );

      expect(response.status).toEqual(200);
      const responseData = await response.json();

      expect(responseData).toEqual({
        id: expect.any(String),
        username: "useruniquy2",
        email: user.email,
        features: ["create:session", "read:session", "update:user"],
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

      const userActivated = await orchestrator.activateUser(user);
      const userSession = await orchestrator.createSession(userActivated.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${userSession.token}`,
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
        features: ["create:session", "read:session", "update:user"],
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

      const userActivated = await orchestrator.activateUser(userCreated);
      const userSession = await orchestrator.createSession(userActivated.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userCreated.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${userSession.token}`,
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
        features: ["create:session", "read:session", "update:user"],
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
