# Bloom — Firebase + GitHub Pages Updated Package

This is the updated Bloom Firebase package for the GitHub Pages setup.

## Included

- Real Firebase account registration
- Real Firebase login
- No demo/guest mode
- Mum / Partner accounts
- Two-person Bloom family model
- Partner invitation
- Firestore user profiles
- Firestore family data
- Pregnancy check-ins
- Baby tracker
- Baby timeline
- Updated Firestore security rules
- Firebase Web SDK 12.17.1
- Exact Firebase config supplied for `bloom-bc6d9`

## Hosting

Designed for GitHub Pages.

No Firebase Hosting, npm or Firebase CLI is required for the browser front end.

## Firebase console

Before testing:
1. Enable Authentication → Email/Password.
2. Create Firestore.
3. Publish `firestore.rules`.
4. Add the GitHub Pages domain under Authentication → Settings → Authorised domains.

## Note about the API key error

The package uses the exact configuration supplied by the Firebase Web App.

If the browser still reports `auth/api-key-not-valid`, that is an Authentication/API-key issue rather than a Firestore-rules issue. The Firestore rules are still included and should be published for the next stage.
