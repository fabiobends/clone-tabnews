import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";
import { createRouter } from "next-connect";
import * as cookie from "cookie";

const router = createRouter();

async function postHandler(req, res) {
  const userValues = req.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userValues.email,
    userValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  res.setHeader(
    "Set-Cookie",
    cookie.serialize("session_id", newSession.token, {
      path: "/",
      httpOnly: true,
      maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
      secure: process.env.NODE_ENV === "production",
    }),
  );

  res.status(201).json(newSession);
}

router.post(postHandler);

export default router.handler(controller.errorHandlers);
