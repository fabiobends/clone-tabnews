import database from "infra/database";
import email from "infra/email";
import webserver from "infra/webserver";
import user from "models/user";
import authorization from "models/authorization";
import { ForbiddenError, NotFoundError } from "infra/errors";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      `,
      values: [userId, expiresAt],
    });
    return result.rows[0];
  }

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;
}

async function markTokenAsUsed(tokenId) {
  const result = await database.query({
    text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
    `,
    values: [tokenId],
  });

  return result.rows[0];
}

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);
  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      action: "Contact support if you believe this is an error.",
      message: "You do not have permission to activate this user.",
    });
  }
  return await user.setFeatures(userId, [
    "create:session",
    "read:session",
    "update:user",
  ]);
}

async function findOneValidById(id) {
  const result = await database.query({
    text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1 AND used_at IS NULL AND expires_at > timezone('utc', now())
      LIMIT 1
    `,
    values: [id],
  });

  if (!result.rows[0]) {
    throw new NotFoundError({
      message: "Activation token not found or invalid",
      action: "Verify if the token is correct or contact support",
    });
  }

  return result.rows[0];
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Clone TabNews <contact@example.com>",
    to: user.email,
    subject: "Activate your account",
    text: `${user.username},
Please activate your account by clicking the link below:

${webserver.origin}/register/activate/${activationToken.id}
    
Thank you,
Clone TabNews Team`,
  });
}

const activation = {
  create,
  findOneValidById,
  sendEmailToUser,
  markTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
