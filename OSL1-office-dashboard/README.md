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
