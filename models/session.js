import crypto from "node:crypto";
import database from "infra/database";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function create(userId) {
  async function runInsertQuery(token, userId, expiresAt) {
    const result = await database.query({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
      `,
      values: [token, userId, expiresAt],
    });
    return result.rows[0];
  }

  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS); // 30 days from now
  return await runInsertQuery(token, userId, expiresAt);
}

async function findOneValidSessionByToken(token) {
  async function runSelectQuery(token) {
    const result = await database.query({
      text: `
        SELECT
          *
        FROM
          sessions
        WHERE
          token = $1
          AND expires_at > NOW()
        LIMIT 1
      `,
      values: [token],
    });

    if (result.rowCount === 0) {
      throw new UnauthorizedError({
        message: "Invalid session",
        action: "Please log in and try again",
      });
    }
    return result.rows[0];
  }

  return await runSelectQuery(token);
}

async function renew(sessionId) {
  async function runUpdateQuery(sessionId, newExpiresAt) {
    const result = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2,
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [sessionId, newExpiresAt],
    });
    return result.rows[0];
  }

  const newExpiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  return await runUpdateQuery(sessionId, newExpiresAt);
}

const session = {
  create,
  findOneValidSessionByToken,
  renew,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
