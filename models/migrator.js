import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";

const defaultOptions = {
  dir: resolve("infra", "migrations"),
  verbose: true,
  direction: "up",
  log: () => {},
  migrationsTable: "pgmigrations",
  dryRun: true,
};

async function listPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const migrations = await migrationRunner({ ...defaultOptions, dbClient });
    return migrations;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const migrations = await migrationRunner({
      ...defaultOptions,
      dbClient,
      dryRun: false,
    });
    return migrations;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
