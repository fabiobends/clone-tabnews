import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import password from "models/password";

async function validateUsernameUniqueness(username) {
  const results = await database.query({
    text: `
        SELECT
          username
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        ;`,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "Username already in use",
      action: "Please use a different username",
    });
  }
}

async function validateEmailUniqueness(email) {
  const results = await database.query({
    text: `
        SELECT
          email
        FROM
          users
        WHERE
          LOWER(email) = LOWER($1)
        ;`,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "Email already in use",
      action: "Please use a different email",
    });
  }
}

async function hashPasswordInObject(userValues) {
  const hashedPassword = await password.hash(userValues.password);
  userValues.password = hashedPassword;
}

async function create(userValues) {
  async function runInsertQuery() {
    const result = await database.query({
      text: `
        INSERT INTO users
          (username, email, password)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
        ;`,
      values: [userValues.username, userValues.email, userValues.password],
    });
    return result.rows[0];
  }

  await validateUsernameUniqueness(userValues.username);
  await validateEmailUniqueness(userValues.email);
  await hashPasswordInObject(userValues);
  const newUser = await runInsertQuery();
  return newUser;
}

async function findOneByUsername(username) {
  async function runSelectQuery(username) {
    const result = await database.query({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
      ;`,
      values: [username],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "User not found",
        action: "Please check the username and try again",
      });
    }

    return result.rows[0];
  }

  const userFound = await runSelectQuery(username);
  return userFound;
}

async function updateByUsername(username, updateValues) {
  const currentUser = await findOneByUsername(username);
  if ("username" in updateValues) {
    const newUsername = updateValues.username;
    if (newUsername.toLowerCase() !== currentUser.username.toLowerCase()) {
      await validateUsernameUniqueness(newUsername);
    }
  }

  if ("email" in updateValues) {
    const newEmail = updateValues.email;
    if (newEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
      await validateEmailUniqueness(newEmail);
    }
  }

  if ("password" in updateValues) {
    await hashPasswordInObject(updateValues);
  }

  const runUpdateQuery = async (userWithValues) => {
    const result = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [
        userWithValues.id,
        userWithValues.username,
        userWithValues.email,
        userWithValues.password,
      ],
    });

    return result.rows[0];
  };

  const updatedUser = { ...currentUser, ...updateValues };
  const userAfterUpdate = await runUpdateQuery(updatedUser);
  return userAfterUpdate;
}

const user = {
  create,
  findOneByUsername,
  updateByUsername,
};

export default user;
