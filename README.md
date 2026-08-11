# Bloom — Firebase GitHub Pages — Permissions Fixed

This package fixes the `Missing or insufficient permissions` error that could
appear after a successful Firebase account creation or login.

### Fixed

- Mum account can attach to its new one-member family.
- Partner can join an existing one-member family.
- Family can only grow to two members.
- Partner browser no longer attempts to update the Mum's user document.
- Bloom determines whether a partner is connected from `family.memberIds`.
- Check-ins and baby activity remain restricted to family members.
- Demo mode remains removed.
- Firebase Web SDK remains 12.17.1.
- Your supplied Firebase project configuration remains in the package.

### Required Firebase step

After uploading the package to GitHub, **publish the included `firestore.rules`**
in Firebase Console:

Firestore Database → Rules → replace → Publish.

Then test with a fresh Mum account.
