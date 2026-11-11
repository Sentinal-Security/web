/**
 * Sentinel Autofill Bridge - Popup Script (Cross-Browser Manifest V3)
 */

const SENTINEL_PORTAL_URL = "https://web-beta-orcin-33.vercel.app";
const ext = typeof browser !== "undefined" ? browser : chrome;

document.addEventListener("DOMContentLoaded", () => {
  const contentEl = document.getElementById("content");

  try {
    ext.runtime.sendMessage({ type: "GET_SENTINEL_STATUS" }, (response) => {
      if (response && response.isLoggedIn && response.user) {
        renderLoggedIn(response.user);
      } else {
        renderLoggedOut();
      }
    });
  } catch {
    renderLoggedOut();
  }

  function renderLoggedIn(user) {
    contentEl.innerHTML = `
      <div class="status-card">
        <div class="status-badge" style="color: #34d399;">
          <span class="dot online"></span>
          <span>Sentinel Connected</span>
        </div>
        <div class="user-info">${user.email || user.username || "Authenticated User"}</div>
        <div class="desc" style="margin-top: 6px;">
          Autofill bridge is active. When you launch vaulted credentials from the Sentinel Web Portal, this extension injects them directly into the target login form.
        </div>
      </div>
      <button id="openDashboardBtn" class="btn btn-primary">Open Sentinel Launchpad</button>
    `;

    document.getElementById("openDashboardBtn").addEventListener("click", () => {
      ext.tabs.create({ url: `${SENTINEL_PORTAL_URL}/dashboard` });
    });
  }

  function renderLoggedOut() {
    contentEl.innerHTML = `
      <div class="status-card">
        <div class="status-badge" style="color: #f87171;">
          <span class="dot offline"></span>
          <span>Authentication Required</span>
        </div>
        <div class="desc">
          You are not signed in to Sentinel Security. Please log in to your web portal account to enable credential autofill.
        </div>
      </div>
      <button id="loginBtn" class="btn btn-primary">Sign In to Sentinel</button>
    `;

    document.getElementById("loginBtn").addEventListener("click", () => {
      ext.tabs.create({ url: `${SENTINEL_PORTAL_URL}/login` });
    });
  }
});

