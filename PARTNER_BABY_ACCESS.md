# Bloom — Partner Baby Access

Partner and Mum are still separate roles.

## Mum
- Can submit and manage her own wellbeing/mood check-ins.
- Can add and manage baby activity.
- Can view and manage family settings.

## Partner
- Cannot submit a Mum mood/check-in.
- Cannot edit Mum wellbeing information.
- CAN open the Baby Tracker.
- CAN add baby activity such as feeds, sleep, nappies and notes.
- CAN manage baby activity they created.
- CAN view the shared baby timeline.
- Can see Mum's latest shared wellbeing results.

## Security
Firestore rules enforce the distinction:
- `families/{fid}/checkins/*` create is Mum-only.
- `families/{fid}/babyActivity/*` create is allowed for either family member.
- Baby activity updates/deletes are limited to the member who created that activity.
