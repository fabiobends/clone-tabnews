import retry from "async-retry";

export const waitForAllServices = async () => {
  await waitForWebServer();

  async function waitForWebServer() {
    await retry(
      async () => {
        const response = await fetch("http://localhost:3000/api/v1/status");
        if (!response.ok) {
          throw new Error("Web server is not ready");
        }
      },
      {
        retries: 100,
        maxTimeout: 1000,
        minTimeout: 100,
        randomize: false,
      },
    );
  }
};
