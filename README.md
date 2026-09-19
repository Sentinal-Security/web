# Sentinal Security - Web IAM Portal

Web client for the Sentinal Security system, functioning as an enterprise Identity and Access Management (IAM) user portal (similar to Okta). Provides account registration, user authentication, session state management, and an authenticated user dashboard.

## 1. Tech Stack
* Framework: Next.js 16 (App Router)
* Runtime: React 19
* Language: TypeScript 5
* Styling: Tailwind CSS v4
* Linting: ESLint 9

## 2. Application Routes
* `/` (Home): System status overview displaying real-time connectivity status of the Spring Boot API Gateway and the Supabase PostgreSQL database, along with primary portal navigation.
* `/register`: Functional registration form. Accepts Full Name, Email, and Password. Sends credentials to backend `POST /api/auth/register`.
* `/login`: Functional login form. Accepts Email and Password. Verifies credentials against backend `POST /api/auth/login`, stores session data in `localStorage`, and redirects to `/dashboard`.
* `/dashboard`: Protected route requiring an active session. Displays user profile information, Multi-Factor Authentication (MFA) pairing status, and a sign-out trigger.
* `/dw`: Protected internal build downloads portal. Requires authorization password `seanisbtter`. Displays all CI/CD build outputs with 12-hour formatted timestamps (`hh:mm:ss a`). **Strict No-Design and No-Edit policy applies to this utility.**

## 3. Backend Integration
The frontend connects to the centralized Spring Boot API via `lib/api.ts`.

* Default Backend API URL: `https://backend-pi68.onrender.com`
* Custom Environment Override: Set `NEXT_PUBLIC_API_URL` in `.env.local` to override the backend target for local testing.

### Environment Variable

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL of the Spring Boot Backend | `https://backend-pi68.onrender.com` |

## 4. Local Development

### Prerequisites
* Node.js 20+ installed
* npm package manager

### Installation
```bash
npm install
```

### Starting the Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### Type Checking & Building
```bash
# Type check and production build
npm run build

# Run linter
npm run lint
```

## 5. Jira Project Tracking & Smart Commits
* Jira Board: [Sentinel Security (SS) Board](https://ractopen.atlassian.net/jira/software/projects/SS/boards/2)
* Active Sprint: `SS Sprint 3 - UI/UX Design`
* GitHub Integration: Commits pushed to `Sentinal-Security/web` automatically synchronize with Jira tickets.
* Commit Convention: Include the Jira issue key in square brackets (e.g., `feat(ui): style registration form [SS-45]`) to link commits directly to the ticket.
