# Bloom — Mum vs Partner permissions

**Mum**
- Can submit multi-mood wellbeing check-ins.
- Can record symptoms, sleep, energy and support needs.
- Can manage pregnancy/baby stage.
- Can add baby activity.
- Can manage the connected Partner/family.

**Partner**
- Has a separate Firebase account.
- Cannot submit a mood update.
- Cannot submit or edit Mum's check-ins.
- Cannot add or edit baby activity.
- Can see Mum's most recent shared check-in and family updates.
- Can view the timeline and shared baby information.

The role separation is enforced in the UI and Firestore rules.
