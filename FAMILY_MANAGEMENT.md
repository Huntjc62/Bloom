# Bloom Family Management

Bloom now supports family management while logged in.

- Maximum 2 family members.
- Exactly 1 Mum (owner).
- Maximum 1 Partner.
- Mum can add a Partner using a one-use invitation.
- Mum can remove the Partner without deleting their account.
- Partner can leave the family without deleting their account.
- Once a Partner is removed/leaves, Mum can generate a new invitation.
- A third member cannot be added by the Firestore rules.

## Important Firebase step

Publish the included `firestore.rules` in Firebase Console → Firestore Database → Rules → Publish.

The Partner join flow uses a temporary `pendingInviteCode` field on the Partner's own profile. This allows Firestore to verify the invitation before granting access to the target family, without making all family documents readable to every authenticated user.

## Test
1. Mum logs in → Settings → Add Partner.
2. Partner logs in → Settings → enters code → Join Bloom family.
3. Both users see the family.
4. Mum can Remove the Partner.
5. Partner can leave the family.
6. Mum can Add Partner again.
