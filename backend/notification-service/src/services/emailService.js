const nodemailer = require("nodemailer");
const logger = require("../../../shared/logger/logger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, text }) {
  try {
    await transporter.sendMail({
      from: `"Kafka Ordering System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}`, error);
    throw error;
  }
}

async function verifyEmailConnection() {
  try {
    await transporter.verify();
    logger.info("Email service connected");
  } catch (error) {
    logger.error("Email service connection failed", error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  verifyEmailConnection,
};
