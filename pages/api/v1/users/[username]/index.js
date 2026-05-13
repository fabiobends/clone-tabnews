import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

async function getHandler(req, res) {
  const { username } = req.query;
  const userFound = await user.findOneByUsername(username);

  const secureOutput = authorization.filterOutput(
    req.context.user,
    "read:user",
    userFound,
  );
  res.status(200).json(secureOutput);
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
  const secureOutput = authorization.filterOutput(
    req.context.user,
    "read:user",
    updatedUser,
  );
  res.status(200).json(secureOutput);
}

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .patch(controller.canRequest("update:user"), patchHandler)
  .handler(controller.errorHandlers);
