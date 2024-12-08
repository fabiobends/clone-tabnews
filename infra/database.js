import pg from "pg";
const { Client } = pg;

import dotenv from "dotenv";
dotenv.config({
  path: "./.env.development",
});

const query = async (queryObject) => {
  const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
  });
  try {
    await client.connect();
    const res = await client.query(queryObject);
    return res;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await client.end();
  }
};

export default {
  query: query,
};
