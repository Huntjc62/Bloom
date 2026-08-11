# Bloom — Firebase + GitHub Pages MVP

**Bloom — For you. For baby. For each other.**

This version is designed specifically for a Bloom site hosted on **GitHub Pages**. You do not need Firebase Hosting or the Firebase CLI to run the front end.

## What is connected

- Firebase Authentication
- Email/password registration
- Login/logout
- User profiles
- Mum / Partner roles
- Private two-person family
- One-use partner invite codes
- Firestore family data
- Shared pregnancy check-ins
- Shared baby activity
- Pregnancy / Baby mode
- Firestore security rules

## Firebase setup

In Firebase Console:

1. Authentication → Sign-in method → enable Email/Password.
2. Firestore Database → Create database → use Production mode.
3. Firebase Project settings → Your apps → Web app → confirm the config matches `js/firebase-config.js`.
4. Firebase Console → Firestore → Rules → paste `firestore.rules` and publish.

## GitHub Pages

Push this entire package's contents into your GitHub repository, preserving:

```text
index.html
manifest.json
css/
  styles.css
js/
  app.js
  firebase.js
  firebase-config.js
firestore.rules
firebase.json
```

GitHub Pages serves the ES module JavaScript directly; no npm install is required for this browser version.

## Important Firebase Console setting for GitHub Pages

Authentication → Settings → Authorised domains

Make sure your GitHub Pages domain is listed, for example:

`YOUR-USERNAME.github.io`

If using a project site, also make sure the domain hosting the Bloom app is authorised.

## User/family model

Every person has their own Firebase Authentication UID.

A Bloom family starts with one member.

The owner creates a one-use invitation code.

The partner creates their own account and enters the invitation code.

The family then has exactly two member UIDs.

Shared data is stored under that family ID.

A third user cannot access the family through Firestore rules.

## Important

This is a backend-connected MVP, not a final production health-data system. Before public launch, add:
- email verification UI
- password reset
- invite expiry
- server-side partner pairing with a Cloud Function
- Firebase App Check
- rate limiting / abuse controls
- account deletion/export
- privacy/consent flows
- security-rule emulator testing
- appropriate UK GDPR/privacy review
