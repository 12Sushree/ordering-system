const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const { sendEmail } = require("./services/emailService");

(async () => {
  try {
    await sendEmail({
      to: "sushreeta2537@gmail.com",
      subject: "Kafka Demo Test",
      text: "Hello! Your email service is working.",
    });

    console.log("Email sent successfully.");
  } catch (error) {
    console.error(error);
  }
})();
