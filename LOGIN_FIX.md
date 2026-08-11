# Bloom login fix

The screenshot showed:

`isPartner is not defined`

This is a JavaScript error, not a Firebase authentication or Firestore
permissions error.

The previous role-separation update referenced `isPartner()` before that helper
was reliably present in the deployed `app.js`.

This package adds the role helper at the top-level of `app.js` so both Mum and
Partner login flows can render correctly.

## After replacing the GitHub files

1. Commit/push the files.
2. Wait for GitHub Pages to deploy.
3. Open Bloom in an Incognito/Private window.
4. Log in with the existing Partner account.
5. The Partner should now load the Partner Home rather than the registration page.

The Partner remains read-only for Mum wellbeing and baby logging.
