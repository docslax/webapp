const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const preorderConfig = require("../forms/preorder/config.json");
const vendorConfig = require("../forms/vendor/config.json");

// Setup email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(formConfig, applicationData) {
  const templatePath = path.join(
    __dirname,
    "templates",
    formConfig.emailTemplate
  );

  const htmlBody = await ejs.renderFile(templatePath, {
    applicationData,
    config: formConfig,
    formatDateLong,
  });

  await transporter.sendMail({
    from: `"QMS PAC" <${process.env.EMAIL_USER}>`,
    to: applicationData.email,
    replyTo: "qmspac@qms.bc.ca",
    subject: formConfig.subject,
    html: htmlBody,
  });

  console.log(`📧 Sent ${formConfig.subject} to ${applicationData.email}`);
}

function formatDateLong(dateStr) {
  const date = new Date(dateStr);

  const month = date.toLocaleString("en-US", { month: "long" });
  const day = date.getDate();

  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  else if (day % 10 === 2 && day !== 12) suffix = "nd";
  else if (day % 10 === 3 && day !== 13) suffix = "rd";

  return `${month} ${day}${suffix}, ${date.getFullYear()}`;
}

module.exports = { sendEmail, formatDateLong };
