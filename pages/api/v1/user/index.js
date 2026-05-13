import { createRouter } from "next-connect";
import controller from "infra/controller";
import session from "models/session";
import user from "models/user";
import authorization from "models/authorization";

async function getHandler(req, res) {
  const sessionToken = req.cookies.session_id;
  const validSession = await session.findOneValidSessionByToken(sessionToken);
  const renewedSession = await session.renew(validSession.id);
  const userFound = await user.findOneById(validSession.user_id);

  controller.setSessionCookie(renewedSession.token, res);
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  const secureOutput = authorization.filterOutput(
    req.context.user,
    "read:user:self",
    userFound,
  );
  res.status(200).json(secureOutput);
}

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:session"), getHandler)
  .handler(controller.errorHandlers);
