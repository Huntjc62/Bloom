# Bloom — permissions fix

The previous rules blocked two legitimate operations:

1. A newly registered Mum could create a family but could not attach her user
   document to that family.
2. A Partner could not add themselves as the second family member.
3. The Partner browser was also trying to edit the Mum's user document.

These have now been fixed.

## Publish the new rules

Firebase Console → Firestore Database → Rules

Replace the rules with the included `firestore.rules`, then click **Publish**.

## Test the Mum flow

Use a fresh test account if possible.

1. Create account.
2. Firebase Authentication should create the user.
3. Bloom creates a one-member family.
4. Bloom attaches the user to that family.
5. Bloom opens the dashboard.

## Test the Partner flow

1. Mum → Settings → Create partner invite.
2. Log out.
3. Create a separate Partner account.
4. Enter the invitation code.
5. Partner becomes the second family member.

The Partner browser no longer attempts to edit the Mum's user document.

## If your existing test account is stuck

The earlier attempt may have created the Firebase Authentication user but failed
before creating/linking the family.

You can either:
- delete that test user from Firebase Authentication → Users and register again, or
- use another email address for the test.

## Important

Do not delete your Firestore data unless you want to reset all testing.
