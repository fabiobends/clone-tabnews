import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";

const router = createRouter();

async function patchHandler(req, res) {
  const activationTokenId = req.query.token_id;
  const validToken = await activation.findOneValidById(activationTokenId);
  const userActivationToken = await activation.markTokenAsUsed(activationTokenId);

  await activation.activateUserByUserId(validToken.user_id);
  res.status(200).json(userActivationToken);
}

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);
