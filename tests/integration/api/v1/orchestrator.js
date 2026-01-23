import database from "infra/database";
import retry from "async-retry";
import migrator from "models/migrator";
import user from "models/user";
import { faker } from "@faker-js/faker";

const waitForAllServices = async () => {
  await waitForWebServer();

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

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
};

export default orchestrator;
