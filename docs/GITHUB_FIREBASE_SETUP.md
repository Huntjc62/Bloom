# Bloom — GitHub Pages + Firebase exact setup

## You do NOT need

- VS Code
- Firebase Hosting
- Firebase CLI
- npm
- a Node server

The Bloom front end can remain on GitHub Pages.

## You DO need

- GitHub repository
- Firebase project
- Firebase Authentication
- Cloud Firestore

## Firebase Authentication

Firebase Console:
Build → Authentication → Sign-in method → Email/Password → Enable.

## Firestore

Firebase Console:
Build → Firestore Database → Create database → Production mode.

## Firestore rules

Open Firestore → Rules.

Replace the rules with the `firestore.rules` file from this package and click Publish.

## Authentication authorised domains

Firebase Console:
Authentication → Settings → Authorised domains.

Add the domain where your GitHub Pages Bloom app is hosted.

## GitHub

Replace the files in your existing Bloom repository with this package.

Commit and push.

Wait for GitHub Pages to rebuild.

Then test:

### Test 1 — Mum
- Register Sarah
- Select Mum
- Confirm user appears in Authentication
- Confirm `users/{Sarah UID}` appears in Firestore
- Confirm a family is created

### Test 2 — Partner
- Register a second account
- Select Partner
- Enter Sarah's invitation code
- Confirm the family now contains exactly two UIDs

### Test 3 — Third user
- Register a third account
- Try Sarah's invitation code
- It must be rejected

### Test 4 — isolation
A third account must not be able to read:
- Sarah's profile
- Sarah's family
- Sarah's check-ins
- Sarah's baby activity

## Browser note

The Firebase web config is designed to be present in the client. It is not an Admin SDK credential. Never put a Firebase service-account private key in GitHub Pages.
