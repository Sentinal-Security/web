(function(){function V(n){return n}var N=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome,h=N,P={matches:["<all_urls>"],excludeMatches:["https://web-beta-orcin-33.vercel.app/*","https://sentinal-security.vercel.app/*","https://sentinel-control-green.vercel.app/*","http://localhost:3000/*","http://127.0.0.1:3000/*","http://localhost:3004/*","http://127.0.0.1:3004/*"],allFrames:!0,runAt:"document_idle",main(){let n=!1,e=0,a=null,r=null,u=null,E=null;function x(t){if(!t||t.disabled||t.readOnly)return!1;const o=window.getComputedStyle(t);if(o.display==="none"||o.visibility==="hidden"||o.opacity==="0")return!1;const l=t.getBoundingClientRect();return l.width>0&&l.height>0}function A(t,o){if(!(!t||o===void 0||o===null))try{t.focus();const l=Object.getPrototypeOf(t),i=Object.getOwnPropertyDescriptor(l,"value");i&&i.set?i.set.call(t,o):t.value=o,t.dispatchEvent(new Event("input",{bubbles:!0,cancelable:!0})),t.dispatchEvent(new Event("change",{bubbles:!0,cancelable:!0})),t.dispatchEvent(new Event("blur",{bubbles:!0,cancelable:!0}))}catch{}}function k(){const t=Array.from(document.querySelectorAll('input[type="password"], input#pass, input[name="pass"]')).filter(l=>x(l))[0]||null;let o=null;if(t&&t.form){const l=Array.from(t.form.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"])')).filter(i=>x(i));o=l.find(i=>{const s=(i.name+" "+i.id+" "+i.placeholder+" "+i.type+" "+(i.getAttribute("autocomplete")||"")).toLowerCase();return s.includes("email")||s.includes("user")||s.includes("login")||s.includes("account")||s.includes("phone")})||l[0]||null}if(o||(o=Array.from(document.querySelectorAll('input#email, input[name="email"], input[autocomplete="username"], input[autocomplete="email"], input[type="email"], input[name*="user" i], input[name*="login" i], input[name*="email" i], input[id*="email" i], input[id*="user" i], input[placeholder*="email" i], input[placeholder*="user" i]')).filter(l=>x(l))[0]||null),!o&&t){const l=Array.from(document.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])')).filter(i=>x(i));for(let i=l.length-1;i>=0;i--){const s=l[i];if(s.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_FOLLOWING){o=s;break}}}return{usernameInput:o,passwordInput:t}}function q(t,o){const l=['button[name="login"]',"#loginbutton",'[data-testid*="royal-login" i]','[data-testid*="royal_login" i]','button[type="submit"]','input[type="submit"]','[role="button"][aria-label*="log in" i]','[role="button"][aria-label*="sign in" i]'],i=t||o?.closest("form, [role='dialog'], main, section, div")||document;for(const d of l){const c=i.querySelector(d);if(c)return c}const s=Array.from((t||document).querySelectorAll('button, [role="button"], input[type="button"]')).find(d=>{const c=((d.textContent||"")+" "+(d.getAttribute("value")||"")+" "+(d.getAttribute("aria-label")||"")).trim().toLowerCase();return/\b(sign in|log in|login|submit|continue|authorize)\b/.test(c)});return s||(t?t.querySelector('button:not([type="button"])'):null)}function m(){r&&r.parentNode&&r.parentNode.removeChild(r),r=null,u=null,E=null}function z(t){if(!u)return;const o=u.getElementById("sentinel-prompt-body");o&&(o.innerHTML=`
        <div class="approved-box">
          <div class="approved-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div>
            <div class="approved-title">Sentinel Approval Verified</div>
            <div class="approved-sub">Signing you in to ${y(t||"application")}...</div>
          </div>
        </div>
      `)}function y(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function D(t,o,l){if(window!==window.top)return;const i=t?.backendId||t?.id||t?.name||"default";if(r&&E===i)return;m(),E=i;const s=document.createElement("div");s.id="sentinel-iam-inpage-prompt",s.style.cssText="position: fixed !important; top: 20px !important; right: 20px !important; z-index: 2147483647 !important; pointer-events: auto !important;";const d=s.attachShadow({mode:"closed"});r=s,u=d;const c=t?.name||document.title||window.location.hostname,f=t?.vaultUsername||o?.email||"Sentinel Linked Account",p=t?.isVault?"Vault Autofill":"Zero-Trust SSO";d.innerHTML=`
        <style>
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
          }
          .sentinel-card {
            width: 340px;
            background: rgba(12, 20, 36, 0.97);
            border: 1px solid rgba(56, 225, 255, 0.4);
            border-radius: 16px;
            padding: 16px;
            color: #f8fafc;
            box-shadow: 0 20px 45px rgba(2, 6, 23, 0.75), 0 0 25px rgba(56, 225, 255, 0.15);
            backdrop-filter: blur(14px);
            animation: sentinelSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes sentinelSlideIn {
            from {
              opacity: 0;
              transform: translateY(-10px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(148, 163, 184, 0.16);
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .shield-box {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: rgba(56, 225, 255, 0.12);
            border: 1px solid rgba(56, 225, 255, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #38e1ff;
            flex-shrink: 0;
          }
          .brand-text {
            display: flex;
            flex-direction: column;
          }
          .brand-title {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #38e1ff;
          }
          .brand-sub {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 1px;
          }
          .close-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #94a3b8;
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .close-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #ffffff;
          }
          .app-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;
          }
          .app-title {
            font-size: 15px;
            font-weight: 700;
            color: #ffffff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .protocol-pill {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 2px 7px;
            border-radius: 999px;
            background: rgba(56, 225, 255, 0.12);
            color: #38e1ff;
            border: 1px solid rgba(56, 225, 255, 0.28);
            flex-shrink: 0;
          }
          .desc {
            font-size: 12px;
            line-height: 1.45;
            color: #cbd5e1;
            margin: 0 0 12px 0;
          }
          .identity-pill {
            background: rgba(24, 41, 61, 0.75);
            border: 1px solid rgba(100, 116, 139, 0.35);
            border-radius: 10px;
            padding: 8px 10px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${l?"#34d399":"#fbbf24"};
            box-shadow: 0 0 8px ${l?"#34d399":"#fbbf24"};
            flex-shrink: 0;
          }
          .identity-info {
            min-width: 0;
            flex: 1;
          }
          .identity-label {
            font-size: 10px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            font-weight: 600;
          }
          .identity-val {
            font-size: 12px;
            font-weight: 600;
            color: #f1f5f9;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 1px;
          }
          .auth-btn {
            width: 100%;
            padding: 10px 14px;
            border-radius: 10px;
            border: none;
            background: #38e1ff;
            color: #020617;
            font-size: 12.5px;
            font-weight: 700;
            letter-spacing: 0.02em;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.15s ease;
            box-shadow: 0 0 18px rgba(56, 225, 255, 0.28);
          }
          .auth-btn:hover {
            background: #2bc4e0;
          }
          .auth-btn:disabled {
            opacity: 0.75;
            cursor: default;
          }
          .approved-box {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            border-radius: 10px;
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(52, 211, 153, 0.35);
          }
          .approved-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: rgba(16, 185, 129, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .approved-title {
            font-size: 12.5px;
            font-weight: 700;
            color: #6ee7b7;
          }
          .approved-sub {
            font-size: 11px;
            color: #cbd5e1;
            margin-top: 2px;
          }
        </style>
        <div class="sentinel-card" role="dialog" aria-label="Sentinel Security Authentication">
          <div class="header">
            <div class="brand">
              <div class="shield-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div class="brand-text">
                <span class="brand-title">Sentinel Security</span>
                <span class="brand-sub">Zero-Trust Identity Bridge</span>
              </div>
            </div>
            <button type="button" class="close-btn" id="sentinel-dismiss-btn" title="Dismiss">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div id="sentinel-prompt-body">
            <div class="app-row">
              <div class="app-title">${y(c)}</div>
              <span class="protocol-pill">${y(p)}</span>
            </div>
            <p class="desc">
              This site is tied to your Sentinel Security account. Authenticate via Sentinel Web Approval to sign in automatically.
            </p>
            <div class="identity-pill">
              <span class="dot"></span>
              <div class="identity-info">
                <div class="identity-label">Tied Account</div>
                <div class="identity-val">${y(f)}</div>
              </div>
            </div>
            <button type="button" class="auth-btn" id="sentinel-auth-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span id="sentinel-auth-btn-label">Authenticate with Sentinel</span>
            </button>
          </div>
        </div>
      `,d.getElementById("sentinel-dismiss-btn")?.addEventListener("click",()=>{a=window.location.pathname+window.location.search,m()});const b=d.getElementById("sentinel-auth-btn"),g=d.getElementById("sentinel-auth-btn-label");b?.addEventListener("click",()=>{b&&(b.disabled=!0),g&&(g.textContent="Waiting for Sentinel Approval...");try{h.runtime.sendMessage({type:"OPEN_SENTINEL_APPROVAL",service:t,currentUrl:window.location.href}).catch(()=>{b&&(b.disabled=!1),g&&(g.textContent="Authenticate with Sentinel")})}catch{b&&(b.disabled=!1),g&&(g.textContent="Authenticate with Sentinel")}}),(document.body||document.documentElement).appendChild(s)}function I(t,o,l){if(!o&&!t||n)return;n=!0,z(l);let i=0;const s=25,d=setInterval(()=>{i++;const{usernameInput:c,passwordInput:f}=k();if(f||c){if(c&&t&&A(c,t),f&&o&&A(f,o),f){clearInterval(d),e=Date.now();try{h.runtime.sendMessage({type:"AUTOFILL_COMPLETED"}).catch(()=>{})}catch{}setTimeout(()=>{m();const p=f.form||f.closest("form"),b=q(p,f);b?b.click():p&&typeof p.requestSubmit=="function"?p.requestSubmit():p&&typeof p.submit=="function"&&p.submit(),n=!1,t=null,o=null},350)}else if(c&&!f&&i>4){clearInterval(d);const p=(c.form||c.closest("form"))?.querySelector('button, input[type="submit"], #identifierNext')||document.querySelector('#identifierNext, button[type="submit"]');p&&(p.click(),o&&(n=!1,setTimeout(()=>{I(null,o,l)},1200)))}}else i>=s&&(clearInterval(d),n=!1,t=null,o=null)},300)}function U(){const t=window.location.search;return t.includes("ssoToken=")||t.includes("ssoUserId=")}function w(){if(window!==window.top||n||Date.now()-e<8e3)return;const t=window.location.pathname+window.location.search;if(a===t)return;if(U()){m();return}const{usernameInput:o,passwordInput:l}=k();if(!(l||o)){r&&m();return}try{h.runtime.sendMessage({type:"CHECK_SITE_INTEGRATION",url:window.location.href}).then(i=>{if(!i||!i.matched||!i.service){r&&m();return}D(i.service,i.user,!!i.isLoggedIn)}).catch(()=>{})}catch{}}try{h.runtime.onMessage.addListener(t=>{t&&t.type==="INJECT_CREDENTIALS"&&(t.password||t.username)&&I(t.username,t.password,t.appName)})}catch{}if(window===window.top){try{h.runtime.sendMessage({type:"REQUEST_PENDING_CREDENTIALS"}).then(t=>{t&&t.hasCredentials&&(t.password||t.username)?I(t.username,t.password,t.appName):w()}).catch(()=>{w()})}catch{w()}setInterval(w,1800)}}},L={debug:(...n)=>([...n],void 0),log:(...n)=>([...n],void 0),warn:(...n)=>([...n],void 0),error:(...n)=>([...n],void 0)},T=class C extends Event{static EVENT_NAME=S("wxt:locationchange");constructor(e,a){super(C.EVENT_NAME,{}),this.newUrl=e,this.oldUrl=a}};function S(n){return`${h?.runtime?.id}:autofill-target:${n}`}var _=typeof globalThis.navigation?.addEventListener=="function";function M(n){let e,a=!1;return{run(){a||(a=!0,e=new URL(location.href),_?globalThis.navigation.addEventListener("navigate",r=>{const u=new URL(r.destination.url);u.href!==e.href&&(window.dispatchEvent(new T(u,e)),e=u)},{signal:n.signal}):n.setInterval(()=>{const r=new URL(location.href);r.href!==e.href&&(window.dispatchEvent(new T(r,e)),e=r)},1e3))}}}var B=class v{static SCRIPT_STARTED_MESSAGE_TYPE=S("wxt:content-script-started");id;abortController;locationWatcher=M(this);constructor(e,a){this.contentScriptName=e,this.options=a,this.id=Math.random().toString(36).slice(2),this.abortController=new AbortController,this.stopOldScripts(),this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(e){return this.abortController.abort(e)}get isInvalid(){return h.runtime?.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(e){return this.signal.addEventListener("abort",e),()=>this.signal.removeEventListener("abort",e)}block(){return new Promise(()=>{})}setInterval(e,a){const r=setInterval(()=>{this.isValid&&e()},a);return this.onInvalidated(()=>clearInterval(r)),r}setTimeout(e,a){const r=setTimeout(()=>{this.isValid&&e()},a);return this.onInvalidated(()=>clearTimeout(r)),r}requestAnimationFrame(e){const a=requestAnimationFrame((...r)=>{this.isValid&&e(...r)});return this.onInvalidated(()=>cancelAnimationFrame(a)),a}requestIdleCallback(e,a){const r=requestIdleCallback((...u)=>{this.signal.aborted||e(...u)},a);return this.onInvalidated(()=>cancelIdleCallback(r)),r}addEventListener(e,a,r,u){a==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),e.addEventListener?.(a.startsWith("wxt:")?S(a):a,r,{...u,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),L.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){document.dispatchEvent(new CustomEvent(v.SCRIPT_STARTED_MESSAGE_TYPE,{detail:{contentScriptName:this.contentScriptName,messageId:this.id}})),this.options?.noScriptStartedPostMessage||window.postMessage({type:v.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:this.id},"*")}verifyScriptStartedEvent(e){const a=e.detail?.contentScriptName===this.contentScriptName,r=e.detail?.messageId===this.id;return a&&!r}listenForNewerScripts(){const e=a=>{!(a instanceof CustomEvent)||!this.verifyScriptStartedEvent(a)||this.notifyInvalidated()};document.addEventListener(v.SCRIPT_STARTED_MESSAGE_TYPE,e),this.onInvalidated(()=>document.removeEventListener(v.SCRIPT_STARTED_MESSAGE_TYPE,e))}};function F(){}var R={debug:(...n)=>([...n],void 0),log:(...n)=>([...n],void 0),warn:(...n)=>([...n],void 0),error:(...n)=>([...n],void 0)},O=(async()=>{try{const{main:n,...e}=P;return await n(new B("autofill-target",e))}catch(n){throw R.error('The content script "autofill-target" crashed on startup!',n),n}})();return O})();
