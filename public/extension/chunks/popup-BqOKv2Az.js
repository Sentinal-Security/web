(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))n(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const i of t.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function o(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function n(e){if(e.ep)return;e.ep=!0;const t=o(e);fetch(e.href,t)}})();var c=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome,a=c,l="https://web-beta-orcin-33.vercel.app";document.addEventListener("DOMContentLoaded",()=>{const r=document.getElementById("content");if(!r)return;try{a.runtime.sendMessage({type:"GET_SENTINEL_STATUS"}).then(n=>{const e=n?.portalOrigin||l;n&&n.isLoggedIn&&n.user?s(n.user,e,n.servicesCount||0):a.storage.local.get("sentinelSession").then(t=>{const i=t?.sentinelSession;i&&i.isLoggedIn&&i.user?s(i.user,i.portalOrigin||e,Array.isArray(i.services)?i.services.length:0):o(e)}).catch(()=>o(e))}).catch(()=>{o(l)})}catch{o(l)}function s(n,e,t){r&&(r.innerHTML=`
      <div class="status-card">
        <div class="status-badge" style="color: #34d399;">
          <span class="dot online"></span>
          <span>Sentinel Connected (${t} Linked ${t===1?"App":"Apps"})</span>
        </div>
        <div class="user-info">${n.email||n.username||"Authenticated User"}</div>
        <div class="desc" style="margin-top: 6px;">
          In-site authentication popup and autofill bridge are active. Open any linked website or launch from Sentinel Web Portal to authenticate and sign in automatically.
        </div>
      </div>
      <button id="openDashboardBtn" class="btn btn-primary">Open Sentinel Launchpad</button>
    `,document.getElementById("openDashboardBtn")?.addEventListener("click",()=>{a.tabs.create({url:`${e}/dashboard`})}))}function o(n){r&&(r.innerHTML=`
      <div class="status-card">
        <div class="status-badge" style="color: #f87171;">
          <span class="dot offline"></span>
          <span>Authentication Required</span>
        </div>
        <div class="desc">
          You are not signed in to Sentinel Security. Please log in to your web portal account to enable in-site authentication and credential autofill.
        </div>
      </div>
      <button id="loginBtn" class="btn btn-primary">Sign In to Sentinel</button>
    `,document.getElementById("loginBtn")?.addEventListener("click",()=>{a.tabs.create({url:`${n}/login`})}))}});
