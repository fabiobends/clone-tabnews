import user from "models/user";
import password from "models/password";
import { NotFoundError, UnauthorizedError } from "infra/errors";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  async function findUserEmail(email) {
    let storedUser;
    try {
      storedUser = await user.findOneByEmail(email);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Invalid email",
          action: "Please check your email and try again",
        });
      }
      throw error;
    }
    return storedUser;
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Bad password",
        action: "Please check your password and try again",
      });
    }
  }

  try {
    const storedUser = await findUserEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);
    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Invalid email or password",
        action: "Please check your credentials and try again",
      });
    }
    throw error;
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
