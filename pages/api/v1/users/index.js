import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import activation from "models/activation";
import authorization from "@/models/authorization";

async function postHandler(req, res) {
  const userValues = req.body;
  const newUser = await user.create(userValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  const secureOutput = authorization.filterOutput(
    req.context.user,
    "read:user",
    newUser,
  );
  res.status(201).json(secureOutput);
}

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("create:user"), postHandler)
  .handler(controller.errorHandlers);
