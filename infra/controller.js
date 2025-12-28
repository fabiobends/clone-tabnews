import { InternalServerError, MethodNotAllowedError } from "infra/errors";

function onErrorHandler(err, req, res) {
  const publicErrorObject = new InternalServerError({
    cause: err,
    statusCode: err.statusCode,
  });
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

const controller = {
  errorHandlers: {
    onError: onErrorHandler,
    onNoMatch: onNoMatchHandler,
  },
};

export default controller;
