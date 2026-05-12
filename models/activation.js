import database from "infra/database";
import email from "infra/email";
import webserver from "infra/webserver";
import user from "models/user";

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
  return await user.setFeatures(userId, ["create:session"]);
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
};

export default activation;
