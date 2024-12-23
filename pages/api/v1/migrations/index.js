import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const dryRun = req.method === "GET";

    const defaultOptions = {
      dbClient,
      dir: join("infra", "migrations"),
      verbose: true,
      direction: "up",
      migrationsTable: "pgmigrations",
      dryRun,
    };

    const migrations = await migrationRunner(defaultOptions);
    const hasNoMigrations = migrations.length === 0;
    const statusCode = hasNoMigrations || dryRun ? 200 : 201;
    return res.status(statusCode).json(migrations);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient?.end();
  }
}
