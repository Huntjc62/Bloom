# Bloom — GitHub Pages + Firebase — No Demo Mode

## Demo mode has been removed

Bloom no longer uses a fake/demo account.

Authentication is handled by Firebase Authentication.

### First screen
- Log in to Bloom
- Create your Bloom account

### Registration
- Name
- Mum or Partner
- Email
- Password

### Firebase creates
- Authentication user UID
- Firestore user profile

### Family
A Mum account creates a one-member family automatically.

The Mum can create a one-use partner invite.

The Partner creates their own Firebase account and enters the invite.

A family can contain a maximum of two members.

## If old demo mode appears

1. Confirm the new files have been committed to GitHub.
2. Confirm GitHub Pages has deployed the latest commit.
3. Hard refresh the browser.
4. Try an incognito/private window.
5. If necessary, clear the site's LocalStorage.

The new code also removes known legacy Bloom demo keys automatically.

## Firebase settings

Authentication → Sign-in method → Email/Password → Enable.

Authentication → Settings → Authorised domains → add the GitHub Pages domain.

Firestore → Database → create the database.

Firestore → Rules → publish `firestore.rules`.
