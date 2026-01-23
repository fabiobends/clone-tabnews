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
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
          email: "user1@example.com",
          password: "password1",
        }),
      });

      expect(response1.status).toEqual(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user2",
          email: "user2@example.com",
          password: "password1",
        }),
      });

      expect(response2.status).toEqual(201);

      const response3 = await fetch(
        "http://localhost:3000/api/v1/users/user2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "user1",
          }),
        },
      );

      expect(response3.status).toEqual(400);

      const responseData3 = await response3.json();
      expect(responseData3).toEqual({
        name: "ValidationError",
        message: "Username already in use",
        status_code: 400,
        action: "Please use a different username",
      });
    });

    test("With duplicated email", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "useremail1",
          email: "useremail1@example.com",
          password: "password1",
        }),
      });

      expect(response1.status).toEqual(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "useremail2",
          email: "useremail2@example.com",
          password: "password1",
        }),
      });

      expect(response2.status).toEqual(201);

      const response3 = await fetch(
        "http://localhost:3000/api/v1/users/user2",
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

      expect(response3.status).toEqual(400);

      const responseData3 = await response3.json();
      expect(responseData3).toEqual({
        name: "ValidationError",
        message: "Email already in use",
        status_code: 400,
        action: "Please use a different email",
      });
    });

    test("With unique username", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "userunique1",
          email: "userunique1@example.com",
          password: "password1",
        }),
      });

      expect(response.status).toEqual(201);

      const response2 = await fetch(
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

      expect(response2.status).toEqual(200);
      const responseData2 = await response2.json();

      expect(responseData2).toEqual({
        id: expect.any(String),
        username: "userunique2",
        email: "userunique1@example.com",
        password: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(uuidVersion(responseData2.id)).toBe(4);
      expect(Date.parse(responseData2.created_at)).not.toBeNaN();
      expect(Date.parse(responseData2.updated_at)).not.toBeNaN();
      expect(responseData2.updated_at > responseData2.created_at).toBe(true);
    });

    test("With unique email", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "uniqueemail1",
          email: "uniqueemail1@example.com",
          password: "password1",
        }),
      });

      expect(response.status).toEqual(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/uniqueemail1",
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

      expect(response2.status).toEqual(200);
      const responseData2 = await response2.json();

      expect(responseData2).toEqual({
        id: expect.any(String),
        username: "uniqueemail1",
        email: "uniqueemail2@example.com",
        password: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(uuidVersion(responseData2.id)).toBe(4);
      expect(Date.parse(responseData2.created_at)).not.toBeNaN();
      expect(Date.parse(responseData2.updated_at)).not.toBeNaN();
      expect(responseData2.updated_at > responseData2.created_at).toBe(true);
    });

    test("With new password", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "newpassword1",
          email: "newpassword1@example.com",
          password: "password1",
        }),
      });

      expect(response.status).toEqual(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/newpassword1",
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

      expect(response2.status).toEqual(200);
      const responseData2 = await response2.json();

      expect(responseData2).toEqual({
        id: expect.any(String),
        username: "newpassword1",
        email: "newpassword1@example.com",
        password: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(uuidVersion(responseData2.id)).toBe(4);
      expect(Date.parse(responseData2.created_at)).not.toBeNaN();
      expect(Date.parse(responseData2.updated_at)).not.toBeNaN();
      expect(responseData2.updated_at > responseData2.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername("newpassword1");
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
