import * as cookie from "cookie";
import session from "models/session";
import user from "models/user";
import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} from "infra/errors";
import authorization from "@/models/authorization";

function onErrorHandler(err, req, res) {
  if (err instanceof ValidationError || err instanceof NotFoundError || err instanceof ForbiddenError) {
    return res.status(err.statusCode).json(err);
  }

  if (err instanceof UnauthorizedError) {
    clearSessionCookie(res);
    return res.status(err.statusCode).json(err);
  }

  const publicErrorObject = new InternalServerError({
    cause: err,
  });

  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function setSessionCookie(token, response) {
  const setCookie = cookie.serialize("session_id", token, {
    path: "/",
    httpOnly: true,
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
  });
  response.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    httpOnly: true,
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
  });
  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(req, res, next) {
  if (req.cookies?.session_id) {
    await injectAuthenticatedUser(req);
    return next();
  }

  injectAnonymousUser(req);
  return next();
}

async function injectAuthenticatedUser(req) {
  const sessionToken = req.cookies.session_id;
  const existingSession =
    await session.findOneValidSessionByToken(sessionToken);
  const existingUser = await user.findOneById(existingSession.user_id);

  req.context = {
    ...req.context,
    user: existingUser,
  };
}

function injectAnonymousUser(req) {
  const anonymousUser = {
    features: ["read:activation_token", "create:session", "create:user"],
  };

  req.context = {
    ...req.context,
    user: anonymousUser,
  };
}

function canRequest(feature) {
  return function canRequestMiddleware(req, res, next) {
    const { user } = req.context;

    if (authorization.can(user, feature)) {
      return next();
    }

    throw new ForbiddenError({
      message: "You don't have permission to execute this action",
      action: `Verify if your account owns this action: ${feature}`,
    });
  };
}

const controller = {
  errorHandlers: {
    onError: onErrorHandler,
    onNoMatch: onNoMatchHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
