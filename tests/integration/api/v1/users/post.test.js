import { version as uuidVersion } from "uuid";
import orchestrator from "../orchestrator";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
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

      expect(response.status).toEqual(201);

      const responseData = await response.json();
      expect(responseData).toEqual({
        id: expect.any(String),
        username: "user1",
        email: "user1@example.com",
        password: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(uuidVersion(responseData.id)).toBe(4);
      expect(Date.parse(responseData.created_at)).not.toBeNaN();
      expect(Date.parse(responseData.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername("user1");
      const isPasswordCorrect = await password.compare(
        "password1",
        userInDatabase.password,
      );
      expect(isPasswordCorrect).toBe(true);

      const isPasswordIncorrect = await password.compare(
        "wrongpassword",
        userInDatabase.password,
      );
      expect(isPasswordIncorrect).toBe(false);
    });

    test("With duplicated email ignoring case as well", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "janedoe",
          email: "duplicated@example.com",
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
          username: "johndoe",
          email: "duplicated@example.com",
          password: "password2",
        }),
      });

      expect(response2.status).toEqual(400);

      const response3 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "someuser",
          email: "DUPLICATED@example.com",
          password: "password2",
        }),
      });

      expect(response3.status).toEqual(400);

      const responseData3 = await response3.json();
      expect(responseData3).toEqual({
        name: "ValidationError",
        message: "Email already in use",
        status_code: 400,
        action: "Please use a different email",
      });
    });

    test("With duplicated username", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "testuser",
          email: "email@example.com",
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
          username: "testuser",
          email: "email2@example.com",
          password: "password2",
        }),
      });

      expect(response2.status).toEqual(400);

      const response3 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "TESTUSER",
          email: "email3@example.com",
          password: "password3",
        }),
      });

      expect(response3.status).toEqual(400);

      const responseData3 = await response3.json();
      expect(responseData3).toEqual({
        name: "ValidationError",
        message: "Username already in use",
        status_code: 400,
        action: "Please use a different username",
      });
    });
  });
});
