# Bloom — Shared Baby Tracker

This version fixes the Partner navigation and permissions.

## Partner can now
- See **Baby tracker** in the navigation when Baby mode is active.
- Open the Baby Tracker directly from Partner Home.
- Log feeds.
- Log sleep.
- Log nappies.
- Add baby notes.
- Edit/manage their own baby activity.
- Edit the shared baby profile.
- View the baby timeline.

## Partner cannot
- Open or submit the Mum check-in.
- Create Mum mood/wellbeing check-ins.
- Edit Mum wellbeing information.

## Mum
Mum retains full wellbeing/check-in access and can also use the shared Baby Tracker.

## Firebase security
The Firestore rules enforce:
- check-ins: Mum-only creation
- baby activity: either family member can create
- baby activity edits/deletes: creator-only
