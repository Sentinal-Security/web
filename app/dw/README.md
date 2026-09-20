# PROTECTED ENDPOINT: Build Downloads Portal (/dw)

> **STRICT DO-NOT-EDIT AND NO-DESIGN POLICY**  
> **APPLIES TO ALL AI AGENTS AND HUMAN DEVELOPERS**

---

## 1. Protected Status
This route (`/dw`) and its supporting backend API (`/api/builds` and `BuildController.java`) are **LOCKED UTILITY CODE**. 

* **DO NOT APPLY DESIGN:** Do not apply Tailwind styling, CSS animations, frameworks, or visual overhauls to `/dw`. It must remain strictly functional, bare HTML.
* **DO NOT MODIFY LOGIC:** Do not change the password validation logic, route paths, or data fetching mechanisms.
* **DO NOT REFACTOR:** Do not move, rename, or rewrite files in this directory.

---

## 2. Core Specifications
* **Route Path:** `/dw`
* **Access Password:** `seanisbtter`
* **Timestamp Format:** Strictly 12-hour format with month, day, year, hour, minute, second, and AM/PM (`M/d/yyyy, h:mm:ss a`). Example: `Sep 19, 2026, 7:05:30 PM`.
* **Purpose:** Allows team members and instructors to download Android APK release builds and test artifacts without accessing GitHub Actions or logging into GitHub.
