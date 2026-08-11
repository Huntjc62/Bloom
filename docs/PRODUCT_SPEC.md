# Bloom — Firebase MVP Product Specification

## Identity
Each person has a unique Firebase Authentication UID.

## Family relationship
A Bloom family has:
- one owner
- up to one invited partner
- maximum two members

Users do not search for or attach themselves to arbitrary users.

## Shared data boundary
All shared pregnancy, wellbeing and baby records belong to a family ID.

## Authentication flow
Register → Firebase Auth user → Firestore user profile → family creation or partner invite.

## Partner flow
Owner creates invite → partner creates own account → partner enters one-use code → transactional pairing → family contains two UIDs.

## Security
Firestore rules verify:
- authentication
- family membership
- owner permissions
- immutable family membership from the browser
- family-scoped check-in/baby access

Production should move invite redemption to a callable Cloud Function and add App Check, expiry, rate limits and emulator testing.
