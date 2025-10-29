# Office TV Dashboard — Fixed Bullbat (Single Page)
Bullbat is always visible (left). Right column shows one of the three Google files, with optional auto-rotation.

## How to use
1) Edit `config.js`: set your Bullbat URL and your Google Doc/Sheet links (use normal Drive links with `?rm=minimal` if the mini PC is logged in).
2) Serve locally:
   ```bash
   python3 -m http.server 8080
   ```
3) Open http://localhost:8080 — you should see Bullbat on the left, and the right column with switch buttons (and auto-rotate if enabled).

## Notes
- Per-panel auto refresh is available via `refreshMinutes`.
- If a Google frame is blank, try published embed links or keep the browser signed in.
- Third-party logins inside panels use the Storage Access API. Keep the cookie-setting site on `https` and set its cookies with `SameSite=None; Secure`. Include `storage-access-helper.js` on that site (see below) so it can handshake with the dashboard.

### Why cross-site HTTP embeds fail
Modern browsers block the exact scenario of "HTTP site inside an HTTPS dashboard" when cookies are required:

- Any cross-site cookie must be sent with `SameSite=None; Secure`, and the `Secure` flag only works over HTTPS. HTTP responses cannot keep a session inside the iframe.
- When the dashboard is HTTPS (recommended), embedding `http://…` counts as active mixed content and is either prevented or heavily restricted.
- Even if the frame loaded, the parent window can neither read nor forward its cookies because of the same-origin policy.

### Safer alternatives
1. Redirect the user in the top window and complete login there (OAuth/OIDC + PKCE if possible) before returning to the dashboard with your own session cookie.
2. Open the site in a new tab (`target="_blank" rel="noopener"`) and keep your app’s session separate.
3. Ask the vendor to support HTTPS, set cookies with `SameSite=None; Secure`, or expose an OAuth/postMessage style integration.
4. Only as a temporary bridge (and with permission), run a server-side reverse proxy that terminates HTTPS on your domain and rewrites the app—expect breakage and maintenance overhead.

### How the dashboard handles HTTP panels now
- Insecure HTTP panels (like Bullbat) no longer load inline. Instead the panel shows a single "Log in" button that opens the site in a separate tab so the browser can keep its own cookies.
- Closing the Bullbat tab automatically returns focus to the dashboard; click the button again any time you need to reopen it.
- If a pop-up blocker prevents the new tab, allow pop-ups for the dashboard domain and click the button again.

### Enabling storage access inside an embedded login flow
1. Update your iframe content (the remote login page you control) to load the helper script:
   ```html
   <script src="https://your-dashboard-host/storage-access-helper.js"></script>
   <script>
     StorageAccessHelper.setParentOrigin("https://your-dashboard-host");
   </script>
   ```
2. When the user clicks a login/continue button, call `StorageAccessHelper.requestAccess()` **inside the click handler** before the action that needs the cookie:
   ```js
   loginButton.addEventListener("click", async function (event) {
     await StorageAccessHelper.requestAccess();
     // proceed with your normal login logic
   });
   ```
3. The helper automatically reports its state and responds to the parent’s `postMessage` requests so the dashboard can prompt the user if permission is still required.
