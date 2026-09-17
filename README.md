# Combot — Customer Feedback & Public Roadmap Portal

Combot is a production-ready, full-stack Canny/Featurebase-style customer feedback management portal built with Express 4, MongoDB (Mongoose 8), React 18 (Vite), Tailwind CSS v4, and TanStack Query v5. 

Users can submit feature requests, search and filter ideas, upvote atomically, participate in threaded discussions, and track product progress through a live 4-column public Kanban roadmap. Admins feature an inline status pipeline management system.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Technology Stack](#-technology-stack)
3. [Key Features & Architecture](#-key-features--architecture)
4. [Prerequisites](#-prerequisites)
5. [Environment Variables Configuration](#-environment-variables-configuration)
6. [Installation & Dependency Setup](#-installation--dependency-setup)
7. [Database Setup & Admin Seeding](#-database-setup--admin-seeding)
8. [Running the Application Locally](#-running-the-application-locally)
9. [Automated Test Suite](#-automated-test-suite)
10. [API Documentation](#-api-documentation)
11. [Assumptions & Limitations](#-assumptions--limitations)
12. [Security Guidelines](#-security-guidelines)

---

## 🚀 Project Overview

Combot bridges the gap between customer feedback and product development:
- **Community Feedback Feed**: Submit feature suggestions, bug reports, and integrations. Filter by status/category and sort by Trending, Top Voted, or Newest.
- **Atomic Upvoting**: Instant upvoting with MongoDB atomic operations preventing race conditions.
- **Threaded Discussions**: Nested comment replies with official **`🛡️ OFFICIAL RESPONSE`** admin highlights.
- **Public Kanban Roadmap**: Live 4-column board (**Under Review**, **Planned**, **In Progress**, **Shipped**) giving users transparent updates.
- **Admin Status Pipeline**: Authenticated administrators can transition post statuses directly from the UI.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18, Vite |
| **Styling & UI** | Tailwind CSS v4, Lucide React Icons |
| **State & Data Fetching** | TanStack Query v5 (React Query), Axios |
| **Routing** | React Router DOM v6 |
| **Backend Framework** | Node.js, Express 4 |
| **Database & ODM** | MongoDB, Mongoose 8 |
| **Authentication** | Dual-token JWT (Access in-memory + HTTP-only Refresh Cookie with rotation) |
| **Testing** | Vitest, Supertest, MongoMemoryServer |

---

## ⚙️ Environment Variables Configuration

Copy `.env.example` to create `.env` files in both the project root and the `server/` directory:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

### Required Environment Variables

| Variable | Description | Example / Default |
|---|---|---|
| `MONGO_URI` | MongoDB connection string (Atlas or Local) | `mongodb://127.0.0.1:27017/combot` |
| `JWT_SECRET` | Secret key for signing access JWTs | `combot_super_secret_dev_key_12345` |
| `ACCESS_TOKEN_EXPIRES_IN` | Lifespan of access tokens | `15m` |
| `REFRESH_TOKEN_COOKIE_MAX_AGE_MS` | Max age for HTTP-only refresh cookie | `604800000` (7 days) |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment stage (`development` or `production`) | `development` |
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `ADMIN_EMAIL` | Admin account email for seeding | `admin@example.com` |
| `ADMIN_PASSWORD` | Admin account password for seeding | `ChangeMe1!` |

> ⚠️ **IMPORTANT**: Never commit your `.env` file to source control. The `.gitignore` file is configured to exclude all `.env` files.

---

## 📦 Installation & Dependency Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd combot
```

### 2. Install Root Dependencies
```bash
npm install
```

### 3. Install Server & Client Dependencies
```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install

# Return to root directory
cd ..
```

---

## 🗄️ Database Setup & Admin Seeding

Combot supports both **Local MongoDB** (`mongodb://127.0.0.1:27017/combot`) and **MongoDB Atlas**.

### Seed the Admin Account
To create or promote an admin account based on your `.env` credentials, run:

```bash
npm run seed
```

This script will:
1. Connect to your configured MongoDB database.
2. Check if a user with `ADMIN_EMAIL` already exists.
3. If the user exists, promote their role to `admin` and update their password.
4. If not, create a new verified `admin` user account.

---

## 💻 Running the Application Locally

### Run Server & Client Concurrently (Recommended)
From the root directory:

```bash
npm run dev
```

- **Frontend Client**: Runs on `http://localhost:5173`
- **Backend Server**: Runs on `http://localhost:5000`

### Run Services Separately
If preferred, you can run the backend and frontend in separate terminals:

```bash
# Terminal 1: Start Backend Server
cd server
npm run dev

# Terminal 2: Start Frontend Client
cd client
npm run dev
```

---

## 🧪 Automated Test Suite

Run the full integration test suite (20 automated integration tests covering Auth Rotation, Posts, Votes, Comments, and Admin Pipelines):

```bash
cd server
npm test
```

### Test Coverage Highlights:
- **Token Rotation & Security**: Verifies refresh token rotation and token-reuse family revocation.
- **Atomic Votes**: Tests concurrent vote updates to verify zero race conditions.
- **RBAC Enforcement**: Asserts non-admin users receive `403 FORBIDDEN` on admin endpoints.
- **Threaded Comments**: Asserts official admin responses receive `isOfficialResponse: true`.

---

## 📡 API Documentation

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/signup` — Register a new account.
- `POST /api/auth/login` — Log in and receive access token + HTTP-only refresh cookie.
- `POST /api/auth/refresh` — Rotate refresh token and get fresh access token.
- `POST /api/auth/logout` — Revoke refresh token family and clear session.
- `POST /api/auth/forgot-password` — Generate password reset token (simulated link).
- `POST /api/auth/reset-password` — Reset password using token.

### 📝 Feature Requests (`/api/posts`)
- `GET /api/posts` — Fetch posts with status, category, sorting (`trending`, `top`, `newest`), search queries.
- `GET /api/posts/:id` — Get single post details.
- `POST /api/posts` — Submit a new feature request *(Auth required)*.
- `POST /api/posts/:id/vote` — Atomically toggle vote *(Auth required)*.
- `PATCH /api/posts/:id/status` — Update request status *(Admin required)*.

### 💬 Threaded Comments (`/api/posts/:postId/comments`)
- `GET /api/posts/:postId/comments` — Fetch comment thread for a post.
- `POST /api/posts/:postId/comments` — Add comment or reply *(Auth required)*.

---

## 📌 Assumptions & Limitations

1. **Simulated Email Service**: In development mode (`NODE_ENV=development`), email verification and password reset links are printed to the server log and returned in JSON responses for ease of local testing. In production, set `NODE_ENV=production`.
2. **Atomic Upvote Storage**: Votes are stored in an array of user IDs on the Post document using MongoDB `$addToSet` & `$pull`. At massive scale (>100,000 votes per post), this can be migrated to a dedicated `Vote` collection with compound indexing.
3. **Trending Score Algorithm**: Calculated in real-time using:
   $$\text{score} = \frac{\text{voteCount}}{(\text{hoursSincePost} + 2)^{1.5}}$$
4. **Text Search**: Full-text search relies on MongoDB `$text` indexes, which perform word-stemmed matching rather than substring/prefix matching.

---

## 🔒 Security Guidelines

- **No Secrets in Source Control**: Ensure passwords, secrets, and private credentials are kept strictly in local `.env` files.
- **JWT Storage**: Access tokens are kept in-memory on the client (never in `localStorage`).
- **HTTP-Only Cookies**: Refresh tokens are stored in `httpOnly`, `SameSite=Strict` cookies to mitigate XSS attacks.
