import pg from "pg";
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
};

const query = async (queryObject) => {
  let client;
  try {
    client = await getNewClient();
    const res = await client.query(queryObject);
    return res;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await client?.end();
  }
};

export default {
  query,
  getNewClient,
};
