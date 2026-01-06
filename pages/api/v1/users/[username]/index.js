import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";

const router = createRouter();

async function getHandler(req, res) {
  const { username } = req.query;
  const userFound = await user.findOneByUsername(username);
  res.status(200).json(userFound);
}

router.get(getHandler);

export default router.handler(controller.errorHandlers);
