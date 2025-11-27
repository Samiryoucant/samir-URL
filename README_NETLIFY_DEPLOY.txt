SAMIR URL - NETLIFY DEPLOYMENT GUIDE
====================================

STEP 1: CREATE NETLIFY SITE
---------------------------
1. Go to https://app.netlify.com/
2. Sign up/login to your account
3. Click "Add new site" → "Deploy manually"
4. Drag and drop the entire project folder containing all files

STEP 2: VERIFY FILES (CRITICAL)
-------------------------------
Ensure your uploaded folder contains:
✅ index.html
✅ redirect.html  
✅ style.css
✅ theme.css
✅ script.js
✅ redirect.js
✅ _redirects  <-- NO FILE EXTENSION!
✅ assets.json

IMPORTANT: The `_redirects` file MUST NOT have any extension. 
It should be named exactly `_redirects` (not `_redirects.txt` or anything else).

STEP 3: TEST DEPLOYMENT
-----------------------
1. After upload completes, Netlify will provide a URL like: https://xyz.netlify.app
2. Visit your site and test these features:

   BASIC FUNCTIONALITY:
   - Enter a long URL and click "Shorten"
   - Copy the generated short URL
   - Click the short URL to test redirection
   - Check Recent Links section

   REDIRECT TESTING:
   - Create a short link: https://samirurl.netlify.app/abc123
   - Visit the short URL directly
   - Should redirect after 2-second countdown

   THEME TESTING:
   - Click theme toggle button (sun/moon)
   - Refresh page - theme should persist

STEP 4: CUSTOM DOMAIN (OPTIONAL)
---------------------------------
1. In Netlify dashboard: Site settings → Domain management
2. Add custom domain: samirurl.netlify.app
3. Update DOMAIN constant in script.js if using custom domain

STEP 5: LOCAL TESTING
---------------------
To test redirects locally:

1. Install http-server:
   npm install -g http-server

2. Serve the project folder:
   npx http-server

3. Open redirect.html with simulated path:
   http://localhost:8080/redirect.html?path=abc123

STEP 6: TROUBLESHOOTING
-----------------------
COMMON ISSUES:

1. Redirects not working:
   - Verify `_redirects` file is in root WITH NO EXTENSION
   - Check Netlify redirects in Site settings → Redirects
   - The file should show as "_redirects" not "_redirects.txt"

2. LocalStorage errors:
   - Open browser DevTools → Application → Local Storage
   - Check samir_links key exists
   - Clear storage if corrupted

3. Theme not persisting:
   - Check samir_theme in LocalStorage
   - Verify theme.css loads properly

STEP 7: MONITORING
------------------
- Check Netlify analytics for traffic
- Monitor LocalStorage usage (typically 5MB limit)
- Test on different devices/browsers

STEP 8: PERSISTENCE NOTES
-------------------------
- Links stored in browser LocalStorage
- Data persists until user clears browser data
- Maximum storage: ~5MB (varies by browser)
- For production: Consider migrating to backend database

STEP 9: SECURITY
----------------
- All URLs validated and sanitized
- Unsafe schemes blocked (javascript:, data:, etc.)
- HTTPS enforced on Netlify
- XSS protection via HTML escaping

STEP 10: SUPPORT
----------------
For issues:
1. Check browser console for errors
2. Verify `_redirects` file has NO extension
3. Test in incognito/private mode
4. Contact support if problems persist

CRITICAL SUCCESS FACTORS:
✅ `_redirects` file exists with NO extension
✅ Short URL creation works
✅ Redirects function after delay  
✅ Recent links display correctly
✅ Copy/share features work
✅ Theme toggle persists
✅ Mobile responsive design

Enjoy your premium URL shortener! 🚀