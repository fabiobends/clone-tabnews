import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";
import { createRouter } from "next-connect";

async function postHandler(req, res) {
  const userValues = req.body;

  const authenticatedUser = await authentication.getUser(
    userValues.email,
    userValues.password,
  );

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "You don't have permission to login",
      action: "Contact support if you think this is an error",
    });
  }

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, res);

  const secureOutput = authorization.filterOutput(
    authenticatedUser,
    "read:session",
    newSession,
  );

  res.status(201).json(secureOutput);
}

async function deleteHandler(req, res) {
  const sessionToken = req.cookies.session_id;
  const existingSession =
    await session.findOneValidSessionByToken(sessionToken);
  const expiredSession = await session.expireById(existingSession.id);

  controller.clearSessionCookie(res);

  const secureOutput = authorization.filterOutput(
    req.context.user,
    "read:session",
    expiredSession,
  );
  res.status(200).json(secureOutput);
}

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("create:session"), postHandler)
  .delete(deleteHandler)
  .handler(controller.errorHandlers);
