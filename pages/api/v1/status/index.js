import database from "@/infra/database.js";
import { InternalServerError } from "@/infra/errors";

export default async function handler(req, res) {
  try {
    const updatedAt = new Date().toISOString();
    const version = (await database.query("SHOW server_version;")).rows[0]
      .server_version;
    const maxConnections = (await database.query("SHOW max_connections;"))
      .rows[0].max_connections;
    const databaseName = process.env.POSTGRES_DB;
    const usedConnections = (
      await database.query({
        text: "SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = $1;",
        values: [databaseName],
      })
    ).rows[0].count;
    res.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version,
          max_connections: parseInt(maxConnections),
          opened_connections: usedConnections,
        },
      },
    });
  } catch (error) {
    const publicErrorObject = new InternalServerError({ cause: error });
    console.error(publicErrorObject);
    res.status(publicErrorObject.statusCode).json(publicErrorObject);
  }
}
