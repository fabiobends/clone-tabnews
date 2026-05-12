import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

async function getHandler(req, res) {
  const { username } = req.query;
  const userFound = await user.findOneByUsername(username);
  res.status(200).json(userFound);
}

async function patchHandler(req, res) {
  const { username } = req.query;

  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(req.context.user, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "You do not have permission to update this user.",
      action: "Verify if you own the feature to update others users.",
    });
  }

  const updatedUser = await user.updateByUsername(username, req.body);
  res.status(200).json(updatedUser);
}

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);
