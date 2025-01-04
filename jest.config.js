const nextJs = require("next/jest");
require("dotenv").config({ path: ".env.development" });

const createJestConfig = nextJs();

const config = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 20000,
});

module.exports = config;
