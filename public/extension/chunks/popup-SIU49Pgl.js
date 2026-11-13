(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))n(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const s of t.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function o(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function n(e){if(e.ep)return;e.ep=!0;const t=o(e);fetch(e.href,t)}})();var l=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome,a=l,c="https://web-beta-orcin-33.vercel.app";document.addEventListener("DOMContentLoaded",()=>{const r=document.getElementById("content");if(!r)return;try{a.runtime.sendMessage({type:"GET_SENTINEL_STATUS"}).then(n=>{n&&n.isLoggedIn&&n.user?i(n.user):o()}).catch(()=>{o()})}catch{o()}function i(n){r&&(r.innerHTML=`
      <div class="status-card">
        <div class="status-badge" style="color: #34d399;">
          <span class="dot online"></span>
          <span>Sentinel Connected</span>
        </div>
        <div class="user-info">${n.email||n.username||"Authenticated User"}</div>
        <div class="desc" style="margin-top: 6px;">
          Autofill bridge is active. When you launch vaulted credentials from the Sentinel Web Portal, this extension injects them directly into the target login form.
        </div>
      </div>
      <button id="openDashboardBtn" class="btn btn-primary">Open Sentinel Launchpad</button>
    `,document.getElementById("openDashboardBtn")?.addEventListener("click",()=>{a.tabs.create({url:`${c}/dashboard`})}))}function o(){r&&(r.innerHTML=`
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
    `,document.getElementById("loginBtn")?.addEventListener("click",()=>{a.tabs.create({url:`${c}/login`})}))}});
