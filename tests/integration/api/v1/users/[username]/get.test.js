import { version as uuidVersion } from "uuid";
import orchestrator from "../../orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "SameCase",
          email: "SameCase@example.com",
          password: "password1",
        }),
      });

      expect(response1.status).toEqual(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/SameCase",
      );

      expect(response2.status).toEqual(200);
      const response2Data = await response2.json();
      expect(response2Data).toEqual({
        id: expect.any(String),
        username: "SameCase",
        email: "SameCase@example.com",
        password: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(uuidVersion(response2Data.id)).toBe(4);
      expect(Date.parse(response2Data.created_at)).not.toBeNaN();
      expect(Date.parse(response2Data.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "diferentcase",
          email: "diferentcase@example.com",
          password: "password1",
        }),
      });

      expect(response1.status).toEqual(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/DiferentCase",
      );

      expect(response2.status).toEqual(200);
      const response2Data = await response2.json();
      expect(response2Data).toEqual({
        id: expect.any(String),
        username: "diferentcase",
        email: "diferentcase@example.com",
        password: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });

      expect(uuidVersion(response2Data.id)).toBe(4);
      expect(Date.parse(response2Data.created_at)).not.toBeNaN();
      expect(Date.parse(response2Data.updated_at)).not.toBeNaN();
    });

    test("With nonexistent username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/notfounduser",
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
  });
});
