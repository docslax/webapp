require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const { sendEmail } = require("./mailer");
const { readData, writeData } = require("./formHandler");
const basicAuth = require("express-basic-auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve each form’s static assets
app.use("/vendor", express.static(path.join(__dirname, "../forms/vendor")));
app.use("/preorder", express.static(path.join(__dirname, "../forms/preorder")));

const adminPassword = process.env.ADMIN_PASS;
if (!adminPassword) {
  throw new Error("❌ ADMIN_PASS must be set in environment variables");
}

app.use(
  "/admin",
  express.static(path.join(__dirname, "../admin")),
  basicAuth({
    users: { admin: adminPassword },
    challenge: true,
  })
);

const clients = [];

// SSE endpoint
app.get("/events", (req, res) => {
  console.log("Client connected to SSE");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write("data: connected\n\n");
  clients.push(res);

  req.on("close", () => {
    const i = clients.indexOf(res);
    if (i !== -1) clients.splice(i, 1);
  });
});

// helper to push updates
function broadcastUpdate() {
  console.log("Broadcasting update to clients");
  clients.forEach((res) => res.write("data: update\n\n"));
}

// Serve main static assets
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin/index.html"));
});

// List submissions for a form
app.get("/api/data/:form", (req, res) => {
  const form = req.params.form;
  const file = path.join(__dirname, `../forms/${form}/data.json`);
  if (!fs.existsSync(file)) {
    return res.json([]);
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  res.json(data);
});

app.patch("/api/data/:form/:index/payment", (req, res) => {
  const form = req.params.form;
  const index = parseInt(req.params.index, 10);

  const file = path.join(__dirname, `../forms/${form}/data.json`);
  if (!fs.existsSync(file)) return res.status(404).send("Form not found");

  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  if (index >= 0 && index < data.length) {
    data[index].paymentReceived = !!req.body.paymentReceived;
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    broadcastUpdate(); // 🔔 notify clients

    return res.json({ success: true });
  }

  res.status(400).send("Invalid index");
});

// Generic submit endpoint
app.post("/submit/:formName", async (req, res) => {
  const { formName } = req.params;
  const applicationData = req.body;
  let result = { success: false, applicationData };

  try {
    const configPath = path.join(__dirname, `../forms/${formName}/config.json`);
    if (!fs.existsSync(configPath))
      throw new Error(`Config for ${formName} not found`);

    const formConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

    // Save data
    const submissions = readData(formConfig.dataFile);
    submissions.push(applicationData);
    writeData(formConfig.dataFile, submissions);
    broadcastUpdate();

    // Send email
    await sendEmail(formConfig, applicationData);

    result.success = true;
  } catch (err) {
    console.error(`[ERROR] submitData(${formName}):`, err);
    result.success = false;
  }

  res.json(result);
});

// Debug route: view data
app.get("/data/:formName", (req, res) => {
  const { formName } = req.params;
  const configPath = path.join(__dirname, `../forms/${formName}/config.json`);

  if (!fs.existsSync(configPath)) {
    return res.status(404).json({ error: `Config for ${formName} not found` });
  }

  const formConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  res.json(readData(formConfig.dataFile));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
