# Sentinel Autofill Bridge — Browser Extension (Manifest V3)

A lightweight middleman extension connecting the **Sentinel Security Web Portal** to external login forms (Facebook, GitHub, Gmail, or custom sites).

---

## How It Works

1. **Session Gate**:
   * The extension verifies that the user is actively signed in to the **Sentinel Web Portal**.
   * If not logged in, autofill remains locked.
2. **Web Portal & Mobile Approval (Zero New UI)**:
   * The user clicks their application on the Sentinel Web Portal Launchpad.
   * The portal displays the standard **Authorize Service Sign-In** modal showing the **2-digit Security Match Number** (e.g., `78`).
   * The user approves the challenge on their paired Sentinel Authenticator mobile app (or enters the 6-digit TOTP code).
3. **Automated Middleman Injection**:
   * Once approved, the extension securely receives the decrypted credentials in-memory.
   * Opens or switches to the destination website.
   * Safely injects the username and password using native input property setters (fully compatible with React, Vue, and Angular).
   * Submits the form automatically and purges credentials from memory.

---

## Loading in Chromium (Chrome, Brave, Edge, Opera)

1. Open your browser and navigate to `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode** using the toggle switch in the upper-right corner.
3. Click **Load unpacked**.
4. Select the `extension/` folder located at:
   `/home/ryme/Personal/School/Information Assurance/Security/extension`
5. The **Sentinel Autofill Bridge** icon will appear in your browser toolbar.

---

## Loading in Mozilla Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Browse to the `extension/` directory and select `manifest.json`.
4. The **Sentinel Autofill Bridge** extension will be active immediately.

