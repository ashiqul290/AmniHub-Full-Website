import nodemailer from "nodemailer";

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM,
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    throw new Error("SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM are required.");
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: "Reset your OmniHub password",
    text: `Use this link to choose a new password. It expires in 30 minutes.\n\n${resetUrl}\n\nIf you did not request a reset, you can ignore this email.`,
  });
}
