const nextJs = require("next/jest");
require("dotenv").config({ path: ".env.development" });

const createJestConfig = nextJs();

const config = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
});

module.exports = config;
