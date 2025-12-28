import migrationRunner from "node-pg-migrate";
import { createRouter } from "next-connect";
import { resolve } from "node:path";
import database from "infra/database";
import controller from "infra/controller";

const router = createRouter();

const handler = ({ isDryRun = true }) =>
  async function (req, res) {
    let dbClient;
    try {
      dbClient = await database.getNewClient();

      const defaultOptions = {
        dbClient,
        dir: resolve("infra", "migrations"),
        verbose: true,
        direction: "up",
        migrationsTable: "pgmigrations",
        dryRun: isDryRun,
      };

      const migrations = await migrationRunner(defaultOptions);
      const hasNoMigrations = migrations.length === 0;
      const statusCode = hasNoMigrations || isDryRun ? 200 : 201;
      return res.status(statusCode).json(migrations);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await dbClient?.end();
    }
  };

const getHandler = handler({ isDryRun: true });
const postHandler = handler({ isDryRun: false });

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);
