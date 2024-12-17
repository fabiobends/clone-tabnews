import migrationRunner from "node-pg-migrate";
import { join } from "node:path";

const defaultOptions = {
  databaseUrl: process.env.DATABASE_URL,
  dir: join("infra", "migrations"),
  verbose: true,
  direction: "up",
  migrationsTable: "pgmigrations",
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const pendingMigrations = await migrationRunner({
      ...defaultOptions,
      dryRun: true,
    });
    return res.status(200).json(pendingMigrations);
  }

  if (req.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultOptions,
      dryRun: false,
    });

    const statusCode = migratedMigrations.length > 0 ? 201 : 200;
    return res.status(statusCode).json(migratedMigrations);
  }

  return res.status(405).end();
}
