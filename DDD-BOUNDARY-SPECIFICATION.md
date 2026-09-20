# Sentinal Security — Domain-Driven Architecture & UI/Logic Boundary Specification (DDD)

> **Document Version:** 1.0  
> **Repository:** Web IAM Portal (`web/`)  
> **Team Structure:** 2-Developer Collaboration Model (Logic / Backend Lead & UI / Visual Designer)  
> **Objective:** Zero-Conflict Architecture for Parallel Logic and UI Development across `backend`, `web`, and `mobile` repositories.

---

## 1. Executive Summary & Team Roles

To enable seamless parallel development between **Logic Implementation** (Backend APIs, state hooks, authentication logic) and **UI/UX Design** ("vibe coding" Tailwind components, visual assets, layouts), the system enforces strict Domain-Driven Boundaries.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN BOUNDARY MODEL                           │
│                                                                        │
│   ┌──────────────────────────────┐    ┌────────────────────────────┐   │
│   │     LOGIC & STATE LAYER      │    │     UI / DESIGN LAYER      │   │
│   │  (API, Hooks, Validation)    │    │ (Components, Styling, UX)  │   │
│   ├──────────────────────────────┤    ├────────────────────────────┤   │
│   │ • API REST Contracts         │    │ • Tailwind CSS Classes     │   │
│   │ • Auth Custom Hooks          │ ──►│ • Unstyled Wrapper Props   │   │
│   │ • State Machine (Idle/Error) │    │ • Layouts, Cards, Themes   │   │
│   └──────────────────────────────┘    └────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Ownership & Merge Protection Matrix

| Repository / Module | Logic Lead Ownership | UI Designer Ownership | Conflict Prevention Rule |
| :--- | :--- | :--- | :--- |
| **Backend Gateway (`backend/`)** | `src/main/java/**` (Controllers, Models, Services) | *No Edits Required* | Full backend isolation. |
| **Web IAM Portal (`web/`)** | `app/api/**`, `hooks/useAuth.ts`, `lib/api.ts` | `components/ui/**`, `app/**/page.tsx` (JSX layout & Tailwind styling) | Logic hooks expose clean state `{ data, loading, error, onSubmit }`. UI designer consumes hooks without touching fetch logic. |
| **Mobile Authenticator (`mobile/`)** | `hooks/useMfaEngine.ts`, `services/api.ts` | `components/**`, `app/(tabs)/**` layout files | Logic encapsulated in custom hooks; UI views render props and bind triggers. |

---

## 3. Web Portal Layer Boundaries & Hook Contracts

UI components must consume domain hooks (`hooks/useAuth.ts`, `hooks/useMfa.ts`) rather than performing raw HTTP `fetch` requests inside component templates.

```typescript
// Custom Hook Pattern for Web UI
export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => { /* logic */ };
  const register = async (email: string, password: string, fullName: string) => { /* logic */ };

  return { login, register, loading, error };
}
```

UI designers can style JSX forms and bind inputs to `login(email, password)` without touching network code.

---

## 4. Protected Paths (No-Edit Policy)

* `web/app/dw/page.tsx` & `web/app/api/builds/` are internal utility routes strictly protected from future refactoring or styling changes.
