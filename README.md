# 🗳️ OVMS – Online Voting Management System

**React 19 · Express 5 · MySQL 8**

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Run Locally](#run-locally)
3. [Deploy to Production](#deploy-to-production)
4. [Host with Docker](#host-with-docker)
5. [How to Use the App](#how-to-use-the-app)
6. [Project Structure](#project-structure)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v22 (minimum v18) |
| npm | v10+ (comes with Node) |
| MySQL | 8.0+ |

---

## Run Locally

### 1 – Clone & install dependencies

```bash
git clone <your-repo-url>
cd online-voting-system-reorganized
npm run install:all
```

### 2 – Configure the server

```bash
cd server
copy .env.example .env     # Windows
cp .env.example .env       # Mac / Linux
```

Edit `server/.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=employee_voting_system
PORT=8000
JWT_SECRET=replace-with-any-random-string-32-chars-min
FRONTEND_URL=http://localhost:3000
```

### 3 – Set up the database

Ensure MySQL is running, then from the `server/` folder:

```bash
npm run migrate
```

This creates the database, all tables, and loads demo data.

### 4 – Start the app

Open **two terminals**:

```bash
# Terminal 1 – Backend (port 8000)
cd server
npm run dev

# Terminal 2 – Frontend (port 3000)
cd client
npm start
```

Open **http://localhost:3000** in your browser.

---

## Deploy to Production

### Environment variables

Set these on your server / hosting platform (never commit a real `.env`):

| Variable | Description |
|----------|-------------|
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port (default 3306) |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `PORT` | API port (default 8000) |
| `JWT_SECRET` | Random string ≥ 32 characters |
| `FRONTEND_URL` | Your production front-end URL |
| `NODE_ENV` | Set to `production` |

### Steps

```bash
# 1. Build the React front-end
cd client
npm ci
npm run build
# → Outputs to client/build/  (serve as static files)

# 2. Install server production dependencies
cd server
npm ci --only=production

# 3. Run database migration
npm run migrate

# 4. Start the API
NODE_ENV=production node src/server.js
```

Serve `client/build/` with **NGINX**, **Apache**, or any static host.  
The API runs on its own port and the front-end hits it via the `REACT_APP_API_URL` env var set at build time.

### NGINX example (reverse proxy)

```nginx
server {
  listen 80;
  server_name yourdomain.com;

  # Serve React build
  root /var/www/ovms/client/build;
  index index.html;
  try_files $uri /index.html;

  # Proxy API requests to Express
  location /api/ {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

---

## Host with Docker

A `Dockerfile` is included for the API server.

```bash
# Build the image
docker build -t ovms-api .

# Run it (supply your env vars)
docker run -d -p 8000:8000 \
  -e DB_HOST=your-mysql-host \
  -e DB_USER=root \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=employee_voting_system \
  -e JWT_SECRET=your-32-char-secret \
  -e FRONTEND_URL=https://yourdomain.com \
  -e NODE_ENV=production \
  --name ovms-api \
  ovms-api
```

For a full-stack Docker setup (API + MySQL):

```yaml
# docker-compose.yml
version: "3.9"
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: employee_voting_system
    ports:
      - "3306:3306"

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DB_HOST: db
      DB_USER: root
      DB_PASSWORD: rootpassword
      DB_NAME: employee_voting_system
      JWT_SECRET: replace-with-32-char-secret
      FRONTEND_URL: http://localhost:3000
      NODE_ENV: production
    depends_on:
      - db
```

```bash
docker-compose up -d
```

---

## How to Use the App

### Initial Setup (First-time Admin Registration)

When launching the app for the first time with a fresh database:
1. Open **http://localhost:3000/admin-login**
2. The system detects no existing administrators and prompts you to create the initial **Super Admin** account.
3. Choose your own username and secure password.

---

### Admin Portal → http://localhost:3000/admin-login

Log in with your created Super Admin credentials.

#### What admins can do

1. **Organization setup** – Set org name, logo, and details.  
2. **Manage locations, branches, departments, designations** – Use the sidebar menus to add/edit/deactivate each.  
3. **Manage employees** – Add individually or bulk-import via CSV (`employees_sample.csv` template available in UI).  
4. **Create elections** – Set title, start/end dates, eligible department (or company-wide), and add candidates.  
5. **Activate elections** – Change status from DRAFT → ACTIVE so employees can vote.  
6. **View results** – After an election closes, view vote counts and participation stats.  
7. **Audit logs** – Track all system actions (logins, votes, edits).

### Employee Portal → http://localhost:3000/login

Employees log in with their **Employee ID** and the password set by the admin.

#### What employees can do

1. **View active elections** they are eligible for.
2. **Cast one vote** per election.
3. **View their profile**.

---

## Project Structure

```
online-voting-system/
│
├── client/                  # React 19 front-end
│   ├── public/              # Static assets
│   ├── src/                 # React source code
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   └── services/        # API calls (axios)
│   ├── .env.example         # Front-end env template
│   └── package.json
│
├── server/                  # Express 5 REST API
│   ├── database/
│   │   ├── schema.sql       # Table definitions
│   │   ├── seed.sql         # Demo data
│   │   └── migrate.js       # Migration runner
│   ├── scripts/             # Utility scripts (CSV import helper)
│   ├── src/
│   │   ├── config/          # env, db, permissions, constants
│   │   ├── controllers/     # Route handlers
│   │   │   └── admin/       # Admin-specific controllers
│   │   ├── middleware/       # auth, errorHandler, rateLimiter, validate
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business logic (eligibility, auditLog, electionState)
│   │   ├── utils/           # asyncHandler
│   │   ├── validators/      # Zod schemas
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # HTTP server entry point
│   ├── .env.example         # Server env template  ← copy to .env
│   └── package.json
│
├── tests/                   # Acceptance test suite
│   ├── api/                 # Node-based API E2E tests
│   ├── ui/                  # Playwright UI tests (Python)
│   ├── run_all.sh           # Full test orchestrator (Linux/Mac/CI)
│   └── spa_server.js        # Static SPA server for UI tests
│
├── .env.example             # Root env template
├── .gitignore
├── Dockerfile               # API container
├── package.json             # Root scripts (install:all, dev:server, dev:client …)
└── README.md                # ← You are here
```

---

## Available Commands

### From the project root

| Command | What it does |
|---------|-------------|
| `npm run install:all` | Install dependencies for both server and client |
| `npm run dev:server` | Start the API server (nodemon) |
| `npm run dev:client` | Start the React dev server |
| `npm run build:client` | Build the React production bundle |
| `npm run db:migrate` | Run database migration and seed |

### From `server/`

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start API with live reload |
| `npm start` | Start API without live reload |
| `npm run migrate` | Run DB migration / seed |
| `npm run lint` | Run ESLint |

### From `client/`

| Command | What it does |
|---------|-------------|
| `npm start` | Start React dev server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
