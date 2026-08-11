# Bloom Phase 1 — Product Specification

## Product promise
Bloom is a shared pregnancy and wellbeing companion that keeps mum and partner connected without requiring constant conversations or manual updates.

## Core users
### Mum
The primary wellbeing and pregnancy tracker.

### Partner
A connected account that receives only the information mum chooses to share.

## Phase 1 feature set

### Authentication
- Sign in/register prototype
- Mum or partner role
- Persistent local session

### Pregnancy
- Due date
- Pregnancy week/day calculation
- Progress bar
- Estimated days remaining
- Timeline

### Mum wellbeing
- Daily mood
- Physical symptoms
- Free-text note
- Share/private choice

### Partner connection
- Connected partner
- Partner name
- Sharing preferences
- Shared update feed
- In-app notification count

## Suggested production architecture
Frontend:
- React Native / Expo for iOS + Android
- TypeScript
- React Navigation

Backend:
- Supabase Auth
- PostgreSQL
- Row Level Security
- Edge Functions for notification logic

Notifications:
- Expo Notifications / APNs / Firebase Cloud Messaging

Analytics:
- PostHog or Firebase Analytics

Monitoring:
- Sentry

Payments:
- RevenueCat for iOS/Android subscriptions

## Core database model
users
- id
- email
- name
- role
- created_at

families
- id
- created_at

family_members
- family_id
- user_id
- role
- status
- invited_at
- accepted_at

pregnancies
- id
- family_id
- due_date
- started_at
- status

wellbeing_checkins
- id
- family_id
- user_id
- mood
- symptoms[]
- note
- shared_with_partner
- created_at

sharing_preferences
- user_id
- share_mood
- share_symptoms
- share_sleep

notifications
- id
- recipient_user_id
- sender_user_id
- type
- payload
- read_at
- created_at

## Privacy principle
Health and pregnancy-related information is sensitive. Production implementation should use explicit consent, least-privilege access, secure authentication, encryption in transit/at rest, deletion/export controls and clear privacy documentation. The app should not present itself as a diagnostic or emergency medical service.

## Phase 1 acceptance criteria
- User can enter Bloom.
- User can set a due date.
- App calculates pregnancy week/day.
- User can complete a mood check-in.
- User can add multiple symptoms.
- User can add a note.
- User can decide whether the check-in is shared.
- Shared check-ins appear in the update centre.
- Partner can be represented as a connected user in the prototype.
- Sharing preferences persist.
- UI works on mobile and desktop.


# Phase 2 — Baby Mode

## Mode transition
- Pregnancy mode remains active before birth.
- When the due date has passed, the next app load prompts the user to confirm whether the baby has arrived.
- "Yes" changes the family experience to Mum & Baby mode.
- "Not yet" keeps pregnancy mode active.
- Users can manually change the stage in Settings at any time.
- The transition must never delete pregnancy or mum wellbeing history.

## Baby data
baby
- id
- family_id
- name
- birth_date
- birth_weight
- created_at

baby_activity
- id
- baby_id
- family_id
- user_id
- type
- subtype
- amount
- duration
- note
- occurred_at
- created_at

## Activity types
feeding
- bottle
- breastfeed
- other

sleep
- nap
- night sleep

nappy
- wet
- dirty
- wet_and_dirty

note
- free text

## Product principle
The baby tracker should be extremely quick to use with one hand. A tired parent should be able to log a feed, sleep event or nappy in a few taps.
