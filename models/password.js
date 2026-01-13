import bcrypt from "bcryptjs";

async function hash(plainPassword) {
  const saltRounds = getNumberOfSaltRounds();
  return await bcrypt.hash(plainPassword, saltRounds);
}

function getNumberOfSaltRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

async function compare(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
