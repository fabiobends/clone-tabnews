import email from "infra/email.js";
import orchestrator from "../../orchestrator.js";

describe("Email Service", () => {
  beforeAll(async () => {
    await orchestrator.deleteAllEmails();
  });

  test("send", async () => {
    await email.send({
      from: "Test <contact@example.com>",
      to: "recipient@example.com",
      subject: "Test Email",
      text: "This is a test email.",
    });

    await email.send({
      from: "Test <contact@example.com>",
      to: "last@example.com",
      subject: "Test Last Email",
      text: "This is the last email.",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contact@example.com>");
    expect(lastEmail.recipients[0]).toBe("<last@example.com>");
    expect(lastEmail.subject).toBe("Test Last Email");
    expect(lastEmail.text).toBe("This is the last email.\n");
  });
});
