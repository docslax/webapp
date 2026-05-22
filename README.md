# QMS PAC Forms Webapp

Lightweight Node.js/Express system for:

- Vendor applications at `/vendor`
- Pre-orders at `/preorder`
- Admin dashboard at `/admin`

The app stores submissions in JSON files, sends confirmation emails via SMTP, and provides an admin dashboard with payment tracking and preorder revenue reporting.

## Runbook

For production operations, deployment, backups, reporting, and config-management procedures, see:

- [RUNBOOK.md](RUNBOOK.md)

## Features

- Vendor and preorder public forms
- Email confirmations on submission (EJS templates + Nodemailer)
- Admin dashboard protected with Basic Auth
- Payment status toggles in admin view
- Live admin refresh via Server-Sent Events
- Preorder item-level paid/unpaid reporting
- CSV export helper for preorder data

## Tech Stack

- Node.js + Express
- jQuery + Semantic UI (frontend)
- Nodemailer (SMTP)
- EJS templates

## Quick Start (Local)

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in project root:

```env
ADMIN_PASS=replace-with-strong-password
SMTP_HOST=smtp.example.com
SMTP_PORT=465
EMAIL_USER=mailer@example.com
EMAIL_PASS=app-password-or-smtp-password
PORT=3000
```

3. Start app:

```bash
npm start
```

4. Open in browser:

- `http://localhost:3000/vendor`
- `http://localhost:3000/preorder`
- `http://localhost:3000/admin`

Admin login:

- Username: `admin`
- Password: value of `ADMIN_PASS`

Dev mode:

```bash
npm run dev
```

## Environment Variables

Required:

- `ADMIN_PASS`
- `SMTP_HOST`
- `SMTP_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`

Optional:

- `PORT` (default `3000`)

## Data and Config Files

Submission data:

- `forms/vendor/data.json`
- `forms/preorder/data.json`

Form config:

- `forms/vendor/config.json`
- `forms/preorder/config.json`

Email templates:

- `server/templates/vendorEmail.ejs`
- `server/templates/preorderEmail.ejs`

## Main Routes

Public routes:

- `GET /vendor`
- `GET /preorder`

Admin route:

- `GET /admin`

API routes:

- `GET /api/data/:form`
- `PATCH /api/data/:form/:index/payment`
- `GET /api/reports/:form`
- `POST /submit/:formName`

Debug route:

- `GET /data/:formName`

## Export Preorders to CSV

```bash
python3 export_preorders.py forms/preorder/data.json export.csv
```

## Project Structure

- `server/` - Express app, mailer, templates
- `forms/preorder/` - preorder frontend, config, data
- `forms/vendor/` - vendor frontend, config, data
- `admin/` - admin dashboard frontend
- `export_preorders.py` - JSON to CSV export utility

## Notes

- Vendor pricing/deadline behavior is partly hardcoded in frontend files. Updating `forms/vendor/config.json` alone may not fully update rendered vendor form pricing/deadline behavior.
- For first-time server setup (systemd, Nginx, TLS, firewall, validation, rollback), use [RUNBOOK.md](RUNBOOK.md).
