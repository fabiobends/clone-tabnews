import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";

const router = createRouter();

async function postHandler(req, res) {
  const userValues = req.body;
  const newUser = await user.create(userValues);
  res.status(201).json(newUser);
}

router.post(postHandler);

export default router.handler(controller.errorHandlers);
