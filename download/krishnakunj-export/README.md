# कृष्णकुंज माँ कर्मा धाम — Temple Donation Website

A production-ready Next.js 16 temple donation website with admin panel, UPI payment integration, donation tracking, receipt generation, and content management system.

Built with: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma ORM · SQLite

---

## Table of Contents

1. [Requirements](#requirements)
2. [Installation](#installation)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Development](#development)
6. [Production Build](#production-build)
7. [Production Start](#production-start)
8. [Deployment](#deployment)
9. [Admin Setup](#admin-setup)
10. [Database Backup & Restore](#database-backup--restore)
11. [Security Notes](#security-notes)
12. [SQLite Persistence Limitation](#sqlite-persistence-limitation)
13. [PostgreSQL Migration Path](#postgresql-migration-path)
14. [Troubleshooting](#troubleshooting)
15. [Project Structure](#project-structure)

---

## Requirements

| Requirement | Version |
|-------------|--------|
| Node.js | >= 18.17 |
| npm | >= 9 |
| Prisma CLI | >= 6.11 (installed via npm) |

---

## Installation

```bash
# 1. Extract the archive or clone the repository
unzip krishnakunj-export.zip
cd krishnakunj-export

# 2. Install dependencies
npm install

# 3. Copy environment file and configure
 cp .env.example .env
# Edit .env — set at minimum:
#   DATABASE_URL="file:./db/custom.db"
#   PAYMENT_UPI_ID="your-upi-id@bank"

# 4. Initialize the database
npx prisma generate
npx prisma db push

# 5. Build and start
npm run build
npm start
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./db/custom.db` | Database connection string |
| `PORT` | No | `3000` | Server port (most platforms set this automatically) |
| `PAYMENT_UPI_ID` | Yes* | (empty) | UPI VPA for receiving donations |
| `PAYMENT_MERCHANT_NAME` | No | `कृष्णकुंज माँ कर्मा धाम` | Name shown on UPI payment screen |
| `PAYMENT_CURRENCY` | No | `INR` | Payment currency (ISO 4217) |

*Required for donation functionality to work.

See `.env.example` for the full list including future integration placeholders (Razorpay, SMTP, WhatsApp API).

---

## Database Setup

### SQLite (Default)

```bash
# Generate Prisma Client
npx prisma generate

# Create/apply schema to database
npx prisma db push

# The database file will be created at: ./db/custom.db
```

### First-Time Setup

The `prisma db push` command creates all tables: Admin, Donation, OfficialMember, CmsContent, Media, Video, ConstructionStage, WebsiteSetting, AuditLog, AdminSession.

No seed data is required — the admin panel has a first-run setup wizard at `/admin/setup`.

### Schema Changes

```bash
# After editing prisma/schema.prisma:
npx prisma db push
npm run build
```

---

## Development

```bash
# Start development server on port 3000
npm run dev

# Run linting
npm run lint

# Reset database (DELETES ALL DATA)
npm run db:reset
```

---

## Production Build

```bash
# Full production build:
# 1. Generates Prisma Client
# 2. Builds Next.js with standalone output
# 3. Copies static assets and public folder into standalone
npm run build
```

The build produces `.next/standalone/` — a self-contained deployment package that includes:
- The Next.js server (`server.js`)
- Required `node_modules` (including Prisma engine binary)
- Static assets and public files

### Build Output Structure

```
.next/standalone/
├── server.js              # Production server entry point
├── .next/
│   └── static/           # Next.js static assets
├── public/               # Static files (images, logo, etc.)
└── node_modules/         # Traced dependencies
```

---

## Production Start

```bash
# Using npm script (respects PORT env var, defaults to 3000)
PORT=3000 npm start

# Or directly using the standalone server
node .next/standalone/server.js
```

The server automatically binds to `0.0.0.0` (all network interfaces).

### Platform PORT Handling

The `npm start` script uses `${PORT:-3000}`, so hosting platforms that set the `PORT` environment variable (Railway, Render, Fly.io, etc.) will work without modification.

---

## Deployment

### Deploying to Any Node.js Platform

The application is designed as a standard Next.js standalone deployment:

**Railway / Render / Fly.io:**
1. Push to GitHub
2. Connect repository to platform
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Set environment variables from `.env.example`
6. Deploy

**Docker (example Dockerfile):**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "server.js"]
```

**VPS / Dedicated Server:**

```bash
# Using PM2
npm install -g pm2
npm run build
pm2 start npm --name "krishnakunj" -- start
pm2 save
pm2 startup
```

---

## Admin Setup

1. Navigate to `/admin/setup` in your browser
2. Fill in the first admin account details:
   - Full name
   - Email address
   - WhatsApp number (for OTP reset)
   - Password (minimum 8 characters)
3. Click "Create Admin"
4. You will be automatically logged in
5. All other admin features are accessible from the sidebar

### Admin Features

- **Dashboard** — Donation statistics, recent activity, analytics
- **Donations** — View, search, export (CSV/Excel) all donation records
- **Officials** — Manage committee members displayed in the footer
- **Media** — Photo gallery management
- **Videos** — Video content management
- **Content (CMS)** — Edit hero text, footer text, temple description
- **Construction** — Track construction progress stages
- **Settings** — Site configuration, donation settings
- **Payment Settings** — UPI ID, bank details (for receipt display)
- **Profile** — Update name, email, WhatsApp, change password
- **Audit Logs** — View all admin and financial actions
- **Forgot Password** — OTP-based reset (requires WhatsApp API for production)

---

## Database Backup & Restore

### SQLite Backup

```bash
# Create backup
cp db/custom.db db/custom-backup-$(date +%Y%m%d-%H%M%S).db

# Or use sqlite3 for proper backup
sqlite3 db/custom.db ".backup db/custom-backup-$(date +%Y%m%d-%H%M%S).db"

# Restore from backup
cp db/custom-backup-YYYYMMDD-HHMMSS.db db/custom.db
```

### Data Export (SQL)

```bash
# Export entire database as SQL
sqlite3 db/custom.db .dump > backup-$(date +%Y%m%d).sql

# Restore from SQL dump
sqlite3 db/custom.db < backup-YYYYMMDD.sql
```

### CSV Export of Donations

The admin panel includes a built-in donation export feature:
1. Log in to `/admin`
2. Go to "Donations"
3. Click "Export CSV" or "Export Excel"

---

## Security Notes

### Authentication
- Passwords are hashed using **scrypt** (Node.js crypto) with timing-safe comparison
- Session tokens are 256-bit cryptographically random (32 bytes)
- Sessions expire after 7 days
- Login has IP-based rate limiting (5 req/60s) and account lockout (10 fails = 30min)

### Payment Security
- `/api/donate/mark-success` requires **admin authentication** (Bearer token)
- Donation creation has IP rate limiting (5 orders/60s)
- Anti-fraud: max 3 PENDING orders per mobile number per 24 hours
- Idempotency key support prevents duplicate orders

### OTP Security
- OTPs are generated using `crypto.randomInt()` (cryptographically secure)
- 5-minute expiry, maximum 5 verification attempts
- OTP is never logged in production (`NODE_ENV=production`)

### API Protection
- All `/api/admin/*` routes require valid Bearer token
- Input validation via Zod schemas on all public endpoints
- Prisma ORM prevents SQL injection
- No raw SQL queries anywhere in the codebase

### Recommendations for Production

1. **Payment Gateway**: Replace the UPI deep-link demo flow with a real gateway (Razorpay/PhonePe) that provides server-side payment verification via webhooks
2. **HTTPS**: Always deploy behind a reverse proxy with TLS (nginx, Caddy, or your platform's built-in HTTPS)
3. **Rate Limiting**: For multi-instance deployments, use Redis-backed rate limiting instead of in-memory Maps
4. **OTP Delivery**: Integrate WhatsApp Business API for production OTP delivery
5. **CORS**: Add CORS headers if your admin panel is served from a different domain

---

## SQLite Persistence Limitation

### When SQLite Works
- **VPS / Dedicated Server** — Persistent disk, works perfectly
- **Docker with volume mounts** — Map `./db/` to a persistent volume
- **Railway / Render (persistent disk)** — Works if the platform offers persistent storage

### When SQLite Does NOT Work
- **Vercel** — Ephemeral filesystem, database is lost on each cold start
- **AWS Lambda** — Read-only filesystem
- **Any serverless platform** — Ephemeral filesystem

### How to Check Your Platform

After deploying, visit `/admin/setup`. If you can create an admin account and it persists after page refresh, your platform has persistent storage. If the setup page reappears, storage is ephemeral.

### What Breaks Without Persistence
- Admin accounts (lost on restart)
- Donation records (lost on restart)
- All CMS content, settings, officials, media (lost on restart)
- Session tokens (users logged out on restart)

### What Still Works Without Persistence
- Public pages (homepage, donate, contact, videos)
- UPI payment link generation (but donations won't be tracked)
- QR code display
- All static content from `temple-config.ts`

---

## PostgreSQL Migration Path

When you need persistent storage on a serverless platform, migrate to PostgreSQL:

### Step 1: Get a PostgreSQL Database

- **Supabase** (free tier available)
- **Neon** (serverless PostgreSQL, free tier)
- **Railway** (PostgreSQL add-on)
- **AWS RDS** / **Google Cloud SQL**

### Step 2: Update Configuration

```bash
# In prisma/schema.prisma, change:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# In .env, set:
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

### Step 3: Migrate

```bash
# Generate Prisma Client for PostgreSQL
npx prisma generate

# Push schema to PostgreSQL (creates all tables)
npx prisma db push

# Rebuild
npm run build
```

### Step 4: Migrate Existing Data (if any)

```bash
# Export from SQLite
sqlite3 db/custom.db .dump > sqlite-dump.sql

# Import to PostgreSQL (may need manual adjustment for syntax differences)
psql $DATABASE_URL < sqlite-dump.sql

# Or use the admin panel's CSV export/import features
```

### No Code Changes Needed

The application uses Prisma ORM throughout — switching from SQLite to PostgreSQL requires **zero application code changes**. Only the schema provider and connection string need to change.

---

## Troubleshooting

### Build fails with "Prisma Client not generated"
```bash
npx prisma generate
npm run build
```

### "Database not available" in production
- Verify `DATABASE_URL` is set correctly in your environment
- For SQLite: ensure the `db/` directory is writable
- For PostgreSQL: verify the connection string and network access

### Port already in use
```bash
# The app respects PORT env var
PORT=8080 npm start
```

### Donations not being tracked
- Check that `PAYMENT_UPI_ID` is set in `.env`
- Verify database is accessible: check server logs for DB errors

### Admin setup page keeps appearing
- Database is not persisting (see SQLite Persistence Limitation above)
- Migrate to PostgreSQL for ephemeral-filesystem platforms

### Images not loading
- Verify `public/` directory is included in your deployment
- Check that image paths in the admin panel are correct

### Prisma engine error
```bash
# Regenerate Prisma Client
npx prisma generate --force
npm run build
```

---

## Project Structure

```
krishnakunj-export/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Homepage
│   │   ├── layout.tsx                  # Root layout
│   │   ├── donate/                     # Donation pages
│   │   │   ├── page.tsx                # Donation form
│   │   │   ├── success/[orderId]/       # Success page
│   │   │   └── layout.tsx
│   │   ├── contact/                    # Contact page
│   │   ├── videos/                     # Videos page
│   │   ├── admin/                      # Admin panel
│   │   │   ├── login/                  # Admin login
│   │   │   ├── setup/                  # First admin setup
│   │   │   ├── dashboard/              # Dashboard
│   │   │   ├── donations/              # Donation management
│   │   │   ├── officials/              # Committee members
│   │   │   ├── media/                  # Photo management
│   │   │   ├── videos/                 # Video management
│   │   │   ├── content/                # CMS content
│   │   │   ├── construction/           # Construction progress
│   │   │   ├── settings/               # Site settings
│   │   │   ├── payment-settings/       # Payment config
│   │   │   ├── profile/                # Admin profile
│   │   │   ├── receipts/               # Receipt management
│   │   │   ├── audit-logs/             # Audit trail
│   │   │   ├── gallery/                # Photo gallery
│   │   │   ├── footer/                 # Footer config
│   │   │   ├── temple-info/            # Temple info
│   │   │   ├── donors/                 # Donor list
│   │   │   ├── security/               # Security settings
│   │   │   └── forgot-password/        # Password reset
│   │   └── api/                        # API routes
│   │       ├── donate/                 # Donation APIs
│   │       ├── admin/                  # Admin APIs
│   │       └── officials/              # Public officials API
│   ├── components/
│   │   ├── temple/                     # Temple-specific components
│   │   ├── admin/                      # Admin panel components
│   │   ├── ui/                         # shadcn/ui components
│   │   └── FloatingWhatsApp*.tsx       # WhatsApp floating button
│   └── lib/
│       ├── db.ts                       # Prisma client (portable)
│       ├── auth.ts                     # Password hashing, sessions
│       ├── admin-auth.ts               # Client-side auth helpers
│       ├── audit.ts                    # Audit logging
│       ├── payment/service.ts          # Payment service
│       ├── otp-store.ts                # OTP storage
│       ├── temple-config.ts            # Temple data (editable)
│       └── utils.ts                    # Utility functions
├── prisma/
│   └── schema.prisma                   # Database schema
├── public/
│   ├── images/                         # Temple images, QR codes
│   ├── logo.svg                        # Temple logo
│   └── robots.txt                      # SEO robots
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── tailwind.config.ts
├── components.json
├── eslint.config.mjs
├── .env.example
├── .gitignore
└── README.md
```

---

## License

This project is built for कृष्णकुंज माँ कर्मा धाम, खैरागढ़ (छ.ग.).
