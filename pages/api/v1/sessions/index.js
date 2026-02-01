import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";
import { createRouter } from "next-connect";

const router = createRouter();

async function postHandler(req, res) {
  const userValues = req.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userValues.email,
    userValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, res);

  res.status(201).json(newSession);
}

async function deleteHandler(req, res) {
  const sessionToken = req.cookies.session_id;
  const existingSession =
    await session.findOneValidSessionByToken(sessionToken);
  const expiredSession = await session.expireById(existingSession.id);

  controller.clearSessionCookie(res);
  res.status(200).json(expiredSession);
}

router.delete(deleteHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);
