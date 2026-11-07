# Sentinal Security — Web IAM Portal

Web client for the Sentinal Security ecosystem, functioning as an enterprise Identity and Access Management (IAM) user portal (modeled after Okta). Provides user registration, primary credentials verification, session management, multi-factor challenge resolution, and an authenticated enterprise user dashboard.

* **Live Web Portal**: [https://web-beta-orcin-33.vercel.app/](https://web-beta-orcin-33.vercel.app/)
* **Authenticator Download Showcase**: [https://web-beta-orcin-33.vercel.app/download](https://web-beta-orcin-33.vercel.app/download)
* **Backend API Gateway**: `https://backend-pi68.onrender.com`

For the unified system walkthrough and architecture specifications, refer to [`UNIFIED-SYSTEM-GUIDE.md`](../UNIFIED-SYSTEM-GUIDE.md).

---

## 1. Tech Stack
* Framework: Next.js 16 (App Router / Turbopack)
* Runtime: React 19
* Language: TypeScript 5
* Styling: Tailwind CSS v4
* Target Port: `3000`

---

## 2. Key Application Routes

* `/`: Landing page and live service health ping against the Spring Boot API Gateway and Supabase PostgreSQL.
* `/register`: User onboarding with real-time password complexity evaluation and workspace creation.
* `/login`: Primary authentication gateway with step-up MFA challenge routing (push notification, TOTP, and emergency recovery code).
* `/dashboard`: Authenticated enterprise portal with profile management, 2FA device pairing modal, security audit trails, and SSO app launchpad.
* `/download`: Public Sentinel Authenticator showcase and direct APK download page.
* `/dw`: Protected internal build downloads portal (password protected, strict no-edit / no-design policy).

---

## 3. Environment Variables

The web portal connects to the centralized Spring Boot API via `lib/api.ts`.

| Variable | Description | Default / Production Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL of the Spring Boot Backend | `https://backend-pi68.onrender.com` (or `http://localhost:8080` for local dev) |

---

## 4. Local Development

### Installation & Run
```bash
cd web
npm install
npm run dev
# Portal opens on http://localhost:3000
```

### Type Check & Linting
```bash
npx tsc --noEmit
npm run lint
```

---

## 5. Protected System Modules Policy

The following routes are strictly protected:
* **`/dw` (`app/dw/page.tsx` & `app/api/builds/`)**:
  * Internal utility protected by password `seanisbtter`.
  * **DO NOT APPLY DESIGN**: Do not restyle, add Tailwind classes, or apply visual themes.
  * **DO NOT MODIFY LOGIC**: Preserve password verification and the 12-hour timestamp format (`hh:mm:ss a`).

---

## 6. Protocols & Tracking
All contributors and AI agents must follow the repository standards documented in [`AGENTS.md`](../AGENTS.md):
* Git identity: `ractopen` (`197402134+ractopen@users.noreply.github.com`)
* Jira issue linking: `[SS-XX]` commit tags
* Perennial branch: `development`
