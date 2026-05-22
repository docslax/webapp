# Webapp Runbook

## 1. System overview

This app is a lightweight Node/Express system that serves:

- Public forms:
  - `/vendor`
  - `/preorder`
- Admin dashboard:
  - `/admin` (HTTP Basic Auth)
- APIs:
  - `GET /api/data/:form`
  - `PATCH /api/data/:form/:index/payment`
  - `GET /api/reports/:form`
  - `POST /submit/:formName`

Main server entrypoint is `server/index.js`.

## 2. Start and stop

From the webapp directory:

```bash
npm install
npm start
```

Dev mode:

```bash
npm run dev
```

Default port is `3000`, override with `PORT`.

## 3. Required environment variables

Set these before starting the app:

- `ADMIN_PASS` (required, used for `/admin` login with username `admin`)
- `SMTP_HOST`
- `SMTP_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `PORT` (optional)

If `ADMIN_PASS` is missing, server startup fails by design.

## 4. Email operations

### 4.1 How emails are sent

On every successful submit (`POST /submit/vendor` or `POST /submit/preorder`):

1. Submission JSON is appended to the form data file.
2. An email is sent via Nodemailer SMTP from `server/mailer.js`.
3. Recipient is always the submitter email (`applicationData.email`).

Email templates:

- Preorder: `server/templates/preorderEmail.ejs`
- Vendor: `server/templates/vendorEmail.ejs`

Subject lines come from each form config:

- `forms/preorder/config.json` -> `subject`
- `forms/vendor/config.json` -> `subject`

### 4.2 Managing email credentials and SMTP

Use `.env` (or deployment secrets) to manage SMTP values.

Example `.env`:

```env
ADMIN_PASS=replace-with-strong-password
SMTP_HOST=smtp.example.com
SMTP_PORT=465
EMAIL_USER=mailer@example.com
EMAIL_PASS=app-password-or-smtp-password
PORT=3000
```

Notes:

- Mailer is configured with `secure: true`, so use an SSL/TLS SMTP port (typically 465).
- `from` is built from `EMAIL_USER`.
- `replyTo` is hardcoded to `qmspac@qms.bc.ca` in `server/mailer.js`.

### 4.3 Common email troubleshooting

- No confirmation email received:
  - Check server logs for submit or SMTP errors.
  - Confirm submitter entered a valid email.
  - Verify SMTP credentials and host/port.
- Auth failures:
  - Rotate `EMAIL_PASS` and restart app.
- Template update:
  - Edit EJS template file and restart server.

## 5. Data storage and management

### 5.1 Where data is saved

Data is stored in JSON arrays:

- Vendor submissions: `forms/vendor/data.json`
- Preorders: `forms/preorder/data.json`

Write path is controlled by `dataFile` in each config.json.

### 5.2 Data model (high level)

Preorder rows include fields like:

- `parentName`, `childInfo`, `phone`, `email`, `etransferName`
- item quantities (`poinsettia`, `centrepiece`, `wreath`, etc.)
- `total`
- `paymentReceived` (boolean; admin can toggle)

Vendor rows include fields like:

- `fullName`, `businessName`, `email`, `phone`
- `tableOption`, `powerNeeded`, `staffContact`
- `total`
- optional `paymentReceived`

### 5.3 Backup and restore

Backup:

```bash
cp forms/preorder/data.json backups/preorder-$(date +%F).json
cp forms/vendor/data.json backups/vendor-$(date +%F).json
```

Restore:

```bash
cp backups/preorder-YYYY-MM-DD.json forms/preorder/data.json
cp backups/vendor-YYYY-MM-DD.json forms/vendor/data.json
```

Restart server after restore to ensure all clients reload fresh state.

### 5.4 Export preorder data to CSV

Utility script is included:

```bash
python3 export_preorders.py forms/preorder/data.json export.csv
```

## 6. Admin dashboard and reports

### 6.1 Access admin

Open `/admin` and authenticate:

- username: `admin`
- password: value of `ADMIN_PASS`

### 6.2 What each tab does

- Preorders tab:
  - Lists preorder submissions
  - Shows collected/uncollected totals
  - Paid checkbox updates `paymentReceived` via PATCH API
- Vendor Signup tab:
  - Lists vendor submissions
  - Shows collected/uncollected totals
  - Paid checkbox updates `paymentReceived`
- Preorder Report tab:
  - Uses `GET /api/reports/preorder`
  - Calculates per-item totals, paid/unpaid quantities and revenue

### 6.3 Real-time updates

Dashboard uses Server-Sent Events (`/events`).

- New submissions and payment toggle updates broadcast an `update` event.
- Open admin pages refresh data automatically.

## 7. Updating config.json files

You asked specifically about both form configs:

- `forms/vendor/config.json`
- `forms/preorder/config.json`

Always keep valid JSON (double quotes, no trailing commas).

### 7.1 Preorder config keys and impact

`forms/preorder/config.json` keys in use:

- `dataFile`: storage file path
- `emailTemplate`: template file name in `server/templates`
- `subject`: email subject
- `paymentDeadline`: shown in preorder page copy
- `pickupDate`, `pickupTime`: used on form and email
- `pickupLocation`: currently defined but not rendered in all views
- `etransferEmail`, `etransferMemo`: used in form messaging
- `items`: drives item cards and report calculations

For each item in `items`, keep:

- `id` (stable key used in saved submission JSON)
- `name` (display label)
- `price` (numeric)

Operational rule:

- Do not rename an existing `id` mid-campaign unless you also migrate historical data keys in `data.json`.

### 7.2 Vendor config keys and impact

`forms/vendor/config.json` keys in use:

- `dataFile`: storage file path
- `emailTemplate`: template file name
- `subject`: email subject
- `title`: rendered on vendor form header
- `etransferEmail`, `etransferMemo`: intended for payment copy
- `eventDate`, `setupTime`, `eventTime`, `location`
- `earlyBirdDeadline`, `regularDeadline`
- `prices.*`

Important current behavior:

- Vendor page event details, pricing labels/amounts, e-transfer copy, and deadline logic are loaded from `forms/vendor/config.json` by `forms/vendor/script.js`.
- After config changes, refresh the page (or restart the app if deployed behind aggressive caching) and verify totals with a test submission.

### 7.3 Safe config edit workflow

1. Backup current config and data files.
2. Edit config JSON.
3. Validate JSON syntax.
4. Restart app.
5. Submit one test entry in each form.
6. Confirm:
   - submission saved in correct `data.json`
   - email arrives with expected subject/content
   - admin views and reports still load

## 8. Routine operations checklist

Daily/weekly operator checks:

- Server process running
- `/vendor`, `/preorder`, `/admin` reachable
- Test submission succeeds
- Confirmation email received
- Data files are updating
- Payment status toggles are working in admin
- Backup of both data files completed

## 9. Known limitations to be aware of

- Report API currently exists only for preorder (`/api/reports/preorder`).

## 10. Quick reference

- Start app: `npm start`
- Admin login: `admin` + `ADMIN_PASS`
- Vendor config: `forms/vendor/config.json`
- Preorder config: `forms/preorder/config.json`
- Vendor data: `forms/vendor/data.json`
- Preorder data: `forms/preorder/data.json`
- Mailer: `server/mailer.js`
- Email templates: `server/templates/*.ejs`

## 11. New server stand-up guide (first deployment)

This section is for deploying from scratch on a new Linux server.

### 11.1 Server prerequisites

- Linux server with internet access
- DNS record pointing to server (if using a domain)
- SMTP credentials ready
- Node.js 20 LTS (or newer compatible LTS)
- npm (installed with Node.js)
- Git
- Nginx (recommended) for reverse proxy + TLS

### 11.2 Create app user and directories

```bash
sudo adduser --system --group --home /opt/webapp webapp
sudo mkdir -p /opt/webapp
sudo chown -R webapp:webapp /opt/webapp
```

### 11.3 Deploy code

Option A: clone repository

```bash
cd /opt
sudo -u webapp git clone <REPO_URL> webapp
cd /opt/webapp
sudo -u webapp npm ci
```

Option B: copy existing working directory

```bash
rsync -av --delete /path/to/current/webapp/ /opt/webapp/
cd /opt/webapp
sudo -u webapp npm ci
```

### 11.4 Create production environment file

Create `/opt/webapp/.env`:

```env
ADMIN_PASS=replace-with-strong-password
SMTP_HOST=smtp.example.com
SMTP_PORT=465
EMAIL_USER=mailer@example.com
EMAIL_PASS=app-password-or-smtp-password
PORT=3000
```

Secure it:

```bash
sudo chown webapp:webapp /opt/webapp/.env
sudo chmod 600 /opt/webapp/.env
```

### 11.5 Initialize writable data files

Ensure data files exist and are writable by `webapp`:

```bash
sudo -u webapp mkdir -p /opt/webapp/forms/preorder /opt/webapp/forms/vendor
sudo -u webapp test -f /opt/webapp/forms/preorder/data.json || echo "[]" | sudo -u webapp tee /opt/webapp/forms/preorder/data.json >/dev/null
sudo -u webapp test -f /opt/webapp/forms/vendor/data.json || echo "[]" | sudo -u webapp tee /opt/webapp/forms/vendor/data.json >/dev/null
```

If migrating from an old server, copy both data files before going live.

### 11.6 Create systemd service

Create `/etc/systemd/system/webapp.service`:

```ini
[Unit]
Description=QMS Webapp
After=network.target

[Service]
Type=simple
User=webapp
Group=webapp
WorkingDirectory=/opt/webapp
ExecStart=/usr/bin/node /opt/webapp/server/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable webapp
sudo systemctl start webapp
sudo systemctl status webapp --no-pager
```

Logs:

```bash
sudo journalctl -u webapp -f
```

### 11.7 Configure Nginx reverse proxy (recommended)

Create `/etc/nginx/sites-available/webapp`:

```nginx
server {
   listen 80;
   server_name your-domain.example.com;

   location / {
      proxy_pass http://127.0.0.1:3000;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header Connection "";
      proxy_buffering off;
   }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/webapp /etc/nginx/sites-enabled/webapp
sudo nginx -t
sudo systemctl reload nginx
```

Add TLS with certbot (example):

```bash
sudo certbot --nginx -d your-domain.example.com
```

### 11.8 Firewall

If using UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 11.9 Go-live validation checklist

1. `systemctl status webapp` shows active/running.
2. Public routes load:

- `/vendor`
- `/preorder`

3. Admin prompts for credentials and loads with `admin` + `ADMIN_PASS`.
4. Submit one test vendor form and one preorder form.
5. Confirm both records appended in:

- `forms/vendor/data.json`
- `forms/preorder/data.json`

6. Confirm confirmation emails are delivered.
7. In admin dashboard, toggle payment status for each test row and confirm it persists after refresh.

### 11.10 Upgrade procedure

1. Backup:

- `.env`
- `forms/vendor/data.json`
- `forms/preorder/data.json`

2. Deploy updated code.
3. Run `npm ci`.
4. Restart service: `sudo systemctl restart webapp`.
5. Execute go-live validation checklist.

### 11.11 Rollback procedure

1. Stop service: `sudo systemctl stop webapp`.
2. Restore previous code release.
3. Restore previous JSON data backup if required.
4. Start service: `sudo systemctl start webapp`.
5. Verify routes, admin, submissions, and email delivery.
