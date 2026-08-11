# Bloom — Firebase GitHub Pages — No Demo Mode

This version removes the demo/guest mode completely.

## The app now starts with

- Log in to Bloom
- Create your Bloom account

There is no demo account, fake user, guest account or local authentication.

Firebase Authentication is the only source of truth for whether someone is signed in.

## If you already used an older Bloom version

The app clears the old Bloom demo/local-login keys from the browser on load. Firebase accounts are unaffected.

## Firebase requirements

In Firebase Console:

1. Authentication → Sign-in method → Email/Password → Enabled.
2. Firestore Database → Create database.
3. Firestore Rules → publish the included `firestore.rules`.
4. Authentication → Settings → Authorised domains → add your GitHub Pages domain.

## GitHub Pages

Replace the files in your existing repository with this package and push the changes.

Because Firebase is loaded as browser ES modules from the official Firebase CDN, you do not need npm, VS Code or Firebase Hosting for this setup.

## Expected first screen

```text
Bloom

For you. For baby. For each other.

Welcome back to Bloom

Email address
[                         ]

Password
[                         ]

[ Log in to Bloom ]

[ New to Bloom? Create an account ]
```

Clicking "Create an account" gives:

```text
Your name
I'm joining Bloom as...
[ Mum ] [ Partner ]

Email address
Password

[ Create my Bloom account ]
```

A successful registration creates a real Firebase Authentication user and a Firestore `users/{uid}` record.

## Important

If the screen still shows an old demo interface after deployment, use a hard refresh or open the GitHub Pages site in a private/incognito window. Also check that GitHub Pages is serving the newly committed `index.html` and `js/app.js`, not an older cached deployment.
