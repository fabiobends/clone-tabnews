import { ValidationError } from "@/infra/errors";
import database from "infra/database";

async function create(userValues) {
  async function valideteEmailUniqueness(email) {
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

  await valideteEmailUniqueness(userValues.email);
  await validateUsernameUniqueness(userValues.username);
  const newUser = await runInsertQuery();
  return newUser;
}

const user = {
  create,
};

export default user;
