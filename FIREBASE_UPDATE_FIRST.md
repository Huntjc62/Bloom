# Bloom — Update these files first

You asked to update the complete GitHub package before making any other Firebase changes.

## 1. Replace your GitHub files

Copy the contents of this package over your existing Bloom repository.

Important files:

- `index.html`
- `js/app.js`
- `js/firebase.js`
- `js/firebase-config.js`
- `firestore.rules`
- `css/styles.css`
- `manifest.json`

## 2. Firebase configuration

`js/firebase-config.js` has been updated to use the configuration you supplied from Firebase:

- Project: `bloom-bc6d9`
- Firebase Web SDK: `12.17.1`
- Exact Firebase Web App config values

## 3. Firestore rules

The included `firestore.rules` is the updated version for the current Bloom MVP data model.

It protects:
- user profiles
- families
- check-ins
- baby activity
- notifications
- partner invitations

The family model is intended to be exactly two people.

## 4. Important limitation

The browser MVP can authenticate users and use Firestore directly, but the most secure production version should move the final partner-pairing operation into a Firebase Cloud Function. That will give Bloom a trusted server-side boundary for:
- one-use invites
- expiry
- rate limiting
- abuse prevention
- exact two-person enforcement

Do not treat the current pairing flow as a final security audit for a public health/wellbeing product.

## 5. After GitHub deploys

Test in this order:

1. Open Bloom in a private/incognito window.
2. Create a real Mum account.
3. Confirm the account appears under Firebase Authentication → Users.
4. Confirm a `users/{uid}` document appears in Firestore.
5. Confirm a `families/{familyId}` document appears.
6. Log out.
7. Create a separate Partner account.
8. Use the invitation code.
9. Confirm both UIDs are linked to the same family.
10. Try a third account and confirm it cannot join.

## 6. If the API-key error still appears

Changing Firestore rules cannot fix `auth/api-key-not-valid`.

That error occurs before Firestore is contacted.

If the exact Firebase config in `js/firebase-config.js` is correct and the error remains, the next place to check is the Google Cloud API key itself and its restrictions. Do not delete or regenerate the key until it has been checked.
