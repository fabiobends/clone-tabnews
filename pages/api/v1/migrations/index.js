import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator";
import authorization from "models/authorization";

const router = createRouter();

async function getHandler(req, res) {
  const pendingMigrations = await migrator.listPendingMigrations();
  const secureOutput = authorization.filterOutput(
    req.context.user,
    "read:migration",
    pendingMigrations,
  );
  res.status(200).json(secureOutput);
}

async function postHandler(req, res) {
  const pendingMigrations = await migrator.runPendingMigrations();

  if (pendingMigrations.length === 0) {
    res.status(200).json(pendingMigrations);
    return;
  }

  res.status(201).json(pendingMigrations);
}

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:migration"), getHandler);
router.post(controller.canRequest("create:migration"), postHandler);

export default router.handler(controller.errorHandlers);
