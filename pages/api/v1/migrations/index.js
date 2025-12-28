import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator";

const router = createRouter();

async function getHandler(req, res) {
  const pendingMigrations = await migrator.listPendingMigrations();
  res.status(200).json(pendingMigrations);
}

async function postHandler(req, res) {
  const pendingMigrations = await migrator.runPendingMigrations();

  if (pendingMigrations.length === 0) {
    res.status(200).json(pendingMigrations);
    return;
  }

  res.status(201).json(pendingMigrations);
}

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);
