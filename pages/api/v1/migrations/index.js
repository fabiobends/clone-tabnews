import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

export default async function handler(req, res) {
  const dbClient = await database.getNewClient();

  const defaultOptions = {
    dbClient,
    dir: join("infra", "migrations"),
    verbose: true,
    direction: "up",
    migrationsTable: "pgmigrations",
  };

  if (req.method === "GET") {
    const pendingMigrations = await migrationRunner({
      ...defaultOptions,
      dryRun: true,
    });

    await dbClient.end();
    return res.status(200).json(pendingMigrations);
  }

  if (req.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultOptions,
      dryRun: false,
    });

    await dbClient.end();
    const statusCode = migratedMigrations.length > 0 ? 201 : 200;
    return res.status(statusCode).json(migratedMigrations);
  }

  return res.status(405).end();
}
