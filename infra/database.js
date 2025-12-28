import pg from "pg";
import { ServiceError } from "infra/errors.js";

const { Client } = pg;

const getSSLOptions = () => {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }
  return process.env.NODE_ENV === "production";
};

const getNewClient = async () => {
  try {
    const client = new Client({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: process.env.POSTGRES_PORT,
      ssl: getSSLOptions(),
    });
    await client.connect();
    return client;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Database connection error",
      cause: error,
    });
    throw serviceErrorObject;
  }
};

const query = async (queryObject) => {
  let client;
  try {
    client = await getNewClient();
    const res = await client.query(queryObject);
    return res;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Database connection error or query execution failed",
      cause: error,
    });
    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
};

const database = {
  query,
  getNewClient,
};

export default database;
