import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";
import authorization from "models/authorization";

const router = createRouter();

async function patchHandler(req, res) {
  const activationTokenId = req.query.token_id;
  const validToken = await activation.findOneValidById(activationTokenId);
  await activation.activateUserByUserId(validToken.user_id);
  const userActivationToken =
    await activation.markTokenAsUsed(activationTokenId);

  const secureOutput = authorization.filterOutput(
    req.context.user,
    "read:activation_token",
    userActivationToken,
  );
  res.status(200).json(secureOutput);
}

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);
