# Sentinal Security - Web IAM Portal

Web client for the Sentinal Security system, functioning as an enterprise Identity and Access Management (IAM) user portal (modeled after identity providers like Okta). Provides identity registration, credential verification, session management, multi-factor challenge resolution, and an authenticated enterprise user dashboard.

## 1. System Architecture & Interoperability

Sentinal Security is an enterprise-grade IAM system comprising three interoperable components:

```
        ┌────────────────────────────────────────────────────────┐
        │                 SUPABASE POSTGRESQL                    │
        │           (Users, Sessions, MFA Credentials)           │
        └───────────────────────────▲────────────────────────────┘
                                    │ JDBC (Port 5432)
        ┌───────────────────────────┴────────────────────────────┐
        │            SPRING BOOT BACKEND API GATEWAY             │
        │           https://backend-pi68.onrender.com            │
        │  • User Auth (BCrypt)       • MFA Verification Engine  │
        └───────────────▲────────────────────────▲───────────────┘
                        │ REST API               │ REST API
        ┌───────────────┴────────┐       ┌───────┴───────────────┐
        │     WEB IAM PORTAL     │       │  MOBILE AUTHENTICATOR │
        │    (`Sentinal/web`)    │       │   (`Sentinal/mobile`) │
        │ • Login / Registration │       │ • Device Pairing      │
        │ • User IAM Dashboard   │       │ • 2FA Code / Approval │
        │ • Login MFA Challenge  │       │ • Out-of-band Verify  │
        └────────────────────────┘       └───────────────────────┘
```

### Component Repositories
* **Web IAM Portal**: [`Sentinal-Security/web`](https://github.com/Sentinal-Security/web) (Current Repository)
* **Backend API Gateway**: [`Sentinal-Security/backend`](https://github.com/Sentinal-Security/backend)
* **Mobile Authenticator**: [`Sentinal-Security/mobile`](https://github.com/Sentinal-Security/mobile)

## 2. Tech Stack
* Framework: Next.js 16 (App Router)
* Runtime: React 19
* Language: TypeScript 5
* Styling: Tailwind CSS v4
* Linting: ESLint 9

## 3. Application Routes
* `/` (Home): Landing page and real-time connectivity status monitor displaying live latency for the Spring Boot API Gateway and Supabase PostgreSQL.
* `/register`: Account registration form. Hashes credentials via Spring Boot `POST /api/auth/register`.
* `/login`: User authentication form. Verifies credentials against `POST /api/auth/login`. Handles step-up 2FA challenges when MFA is enabled.
* `/dashboard`: Protected user dashboard displaying profile details, enrolled security authenticators, and session controls.
* `/dw`: Protected internal build downloads portal. Requires password `seanisbtter`. Displays CI/CD build artifacts with 12-hour formatted timestamps (`hh:mm:ss a`) and direct `.apk` downloads. *(Strict No-Design and No-Edit policy applies to this route).*

## 4. Backend Integration & Environment Variables

The web portal connects to the centralized Spring Boot API via `lib/api.ts`.

| Variable | Description | Default / Production Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL of the Spring Boot Backend | `https://backend-pi68.onrender.com` |

To test against a local backend, create `.env.local` in this folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 5. Local Development

### Prerequisites
* Node.js 20+ installed
* npm package manager

### Installation & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
The portal will be accessible at `http://localhost:3000`.

### Type Check & Build Verification
```bash
npm run build
npm run lint
```

## 6. Git Workflow & Git Town Setup

To keep all repositories synchronized and prevent divergence, all contributors must sync their local branch before making or pushing any changes.

### 6.1 Daily Sync Protocol (Always Sync First)
Before starting any new feature or bugfix, always pull latest remote changes:
```bash
# Using Git Town (Recommended)
git town sync

# Or using standard Git
git checkout development
git pull origin development
```

### 6.2 Git Town Configuration
This repository includes a committed `.git-town.toml`:
* **Main Branch**: `main` (production release branch)
* **Perennial Branch**: `development` (active integration branch)

To initialize or verify Git Town on your local clone:
```bash
git town init
git town config
```

### 6.3 Feature Branch Workflow
1. Create a feature branch off `development`:
   ```bash
   git town hack feature/your-feature-name
   ```
2. Commit changes with Jira key in brackets:
   ```bash
   git commit -m "feat(web): description of change [SS-XX]"
   ```
3. Sync regularly:
   ```bash
   git town sync
   ```
4. Ship back to `development`:
   ```bash
   git town ship
   ```

## 7. Jira Project Tracking & Smart Commits
* Jira Board: [Sentinel Security (SS) Board](https://ractopen.atlassian.net/jira/software/projects/SS/boards/2)
* Project Key: `SS`
* Smart Commits: Include the Jira issue key in square brackets (e.g., `feat(ui): style registration form [SS-45]`) to automatically link Git commits to Jira tickets.
* MCP Protocol: Query Jira for open tickets matching tasks before starting work (`jira_search_issues`), transition to `In Progress` (`jira_transition_issue`), and mark `Done` with a summary comment upon merge.
