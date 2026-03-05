import { faker } from "@faker-js/faker";
import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator";
import session from "models/session";
import user from "models/user";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

const waitForAllServices = async () => {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    await retry(
      async () => {
        const response = await fetch("http://localhost:3000/api/v1/status");
        if (!response.ok) {
          throw new Error("Web server is not ready");
        }
      },
      {
        retries: 100,
        maxTimeout: 1000,
        minTimeout: 100,
        randomize: false,
      },
    );
  }

  async function waitForEmailServer() {
    await retry(
      async () => {
        const response = await fetch(emailHttpUrl);
        if (!response.ok) {
          throw new Error("Email server is not ready");
        }
      },
      {
        retries: 100,
        maxTimeout: 1000,
        minTimeout: 100,
        randomize: false,
      },
    );
  }
};

const clearDatabase = async () =>
  await database.query("DROP SCHEMA public cascade; CREATE SCHEMA public;");

const runPendingMigrations = async () => {
  await migrator.runPendingMigrations();
};

const createUser = async (userValues) => {
  return await user.create({
    username:
      userValues.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userValues.email || faker.internet.email(),
    password: userValues.password || faker.internet.password(),
  });
};

const createSession = async (userId) => {
  return await session.create(userId);
};

const deleteAllEmails = async () => {
  try {
    await fetch(`${emailHttpUrl}/messages`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Failed to delete emails:", error);
  }
};

const getLastEmail = async () => {
  try {
    const response = await fetch(`${emailHttpUrl}/messages`);
    const emails = await response.json();
    const lastEmail = emails.pop();

    const emailDetailsResponse = await fetch(
      `${emailHttpUrl}/messages/${lastEmail.id}.plain`,
    );
    const emailTextBody = await emailDetailsResponse.text();

    lastEmail.text = emailTextBody;

    return lastEmail;
  } catch (error) {
    console.error("Failed to get last email:", error);
    return null;
  }
};

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
};

export default orchestrator;
