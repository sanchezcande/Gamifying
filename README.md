# Gamifying API

Gamifying backend using Node.js + Express + Prisma + PostgreSQL.

## Setup
```bash
npm install
cp .env.example .env
npm run prisma:migrate -- --name init
npm run prisma:generate
npm run prisma:seed
npm start
```

Base URL: `http://localhost:3000`

## Env
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gamifying?schema=public"
JWT_SECRET="super-secret-change-me"
```

## Response Envelope
```json
{ "success": true, "data": {}, "error": null }
```
```json
{ "success": false, "data": null, "error": "message" }
```

## Auth
### POST `/api/auth/register`
Request:
```json
{ "name": "John", "email": "john@mail.com", "password": "password123", "gymId": "gym_id" }
```
Response:
```json
{ "success": true, "data": { "token": "jwt", "user": { "id": "u1", "email": "john@mail.com" } }, "error": null }
```

### POST `/api/auth/login`
Request:
```json
{ "email": "john@mail.com", "password": "password123" }
```
Response:
```json
{ "success": true, "data": { "token": "jwt", "user": { "id": "u1", "email": "john@mail.com" } }, "error": null }
```

### GET `/api/auth/me`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": { "id": "u1", "xp": 500, "gymCoins": 200, "equippedCosmetics": [], "activeSupplements": [] }, "error": null }
```

### POST `/api/auth/create-avatar`
Headers: `Authorization: Bearer <token>`
Request:
```json
{
  "gender": "MALE",
  "faceJawId": 1,
  "faceCheeksId": 1,
  "faceEyeShapeId": 1,
  "faceEyeColorId": 1,
  "faceNoseId": 1,
  "faceHairStyleId": 1,
  "faceHairColorId": 1,
  "faceSkinToneId": 1,
  "faceBeardId": 0,
  "faceEyebrowId": 1
}
```
Response:
```json
{ "success": true, "data": { "id": "u1", "avatarGender": "MALE", "faceJawId": 1 }, "error": null }
```

## Check-ins
### POST `/api/checkins`
Headers: `Authorization: Bearer <token>`
Response:
```json
{
  "success": true,
  "data": {
    "xpEarned": 50,
    "gcEarned": 10,
    "muscleGained": 2,
    "enduranceGained": 1,
    "powerGained": 1,
    "newBodyStage": 2,
    "newClass": "FIGHTER",
    "activeSupplements": ["Protein Shake"]
  },
  "error": null
}
```

### GET `/api/checkins/user/:userId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": [{ "id": "c1", "xpEarned": 50, "createdAt": "2026-02-25T00:00:00.000Z" }], "error": null }
```

## Purchases
### POST `/api/purchases`
Headers: `Authorization: Bearer <token>`
Request:
```json
{ "gymId": "gym_id", "amount": 20 }
```
Response:
```json
{ "success": true, "data": { "gcEarned": 100, "newGymCoinsTotal": 450 }, "error": null }
```

### GET `/api/purchases/user/:userId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": [{ "id": "p1", "amount": 20, "gcEarned": 100 }], "error": null }
```

## Referrals
### POST `/api/referrals`
Headers: `Authorization: Bearer <token>`
Request:
```json
{ "referredEmail": "friend@mail.com" }
```
Response:
```json
{ "success": true, "data": { "xpEarned": 200, "gcEarned": 100 }, "error": null }
```

## Shop
### GET `/api/shop`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": { "SUPPLEMENT": [{ "name": "Protein Shake" }], "COSMETIC": [{ "name": "Red Tank Top" }] }, "error": null }
```

### POST `/api/shop/buy/:itemId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": { "success": true, "newGymCoinsTotal": 350, "item": { "id": "ui1" } }, "error": null }
```

### GET `/api/shop/inventory/:userId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": { "activeSupplements": [], "cosmetics": [] }, "error": null }
```

## Avatar
### GET `/api/avatar/face-options` (public)
Response:
```json
{ "success": true, "data": { "jaw": [{ "id": 1, "label": "oval" }], "cheeks": [{ "id": 1, "label": "flat" }] }, "error": null }
```

### GET `/api/avatar/:userId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": { "class": "FIGHTER", "bodyStage": 2, "equippedCosmetics": [], "activeSupplements": [] }, "error": null }
```

### POST `/api/avatar/:userId/equip/:itemId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": [{ "id": "ui1", "isEquipped": true, "shopItem": { "category": "OUTFIT" } }], "error": null }
```

## Battles
### POST `/api/battles/challenge/:defenderId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": { "challengerProbability": 0.55, "defenderProbability": 0.45, "winnerId": "u1", "gcEarned": 50, "xpEarned": 30 }, "error": null }
```

### GET `/api/battles/history/:userId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": [{ "result": "won", "opponentName": "Marcos", "probability": 0.55 }], "error": null }
```

### GET `/api/battles/leaderboard/:gymId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": [{ "userId": "u1", "name": "Carlos", "wins": 5 }], "error": null }
```

## Leaderboard
### GET `/api/leaderboard/:gymId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": [{ "rank": 1, "name": "Carlos", "xp": 3400, "currentMonthXp": 600 }], "error": null }
```

### GET `/api/leaderboard/:gymId/bodybuilding`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": [{ "rank": 1, "name": "Carlos", "score": 94.5 }], "error": null }
```

## Competitions
### GET `/api/competitions/:gymId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": { "competition": { "status": "ACTIVE" }, "standings": [{ "rank": 1, "name": "Carlos" }] }, "error": null }
```

### GET `/api/competitions/:gymId/history`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": [{ "month": 1, "year": 2026, "winner": { "name": "Carlos" } }], "error": null }
```

### POST `/api/competitions/:gymId/close`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": { "winner": "Carlos", "second": "Ayu", "third": "Dimas", "prizesAwarded": [] }, "error": null }
```

## Gyms
### POST `/api/gyms`
Headers: `Authorization: Bearer <token>`
Request:
```json
{ "name": "Iron Temple", "location": "Bali" }
```
Response:
```json
{ "success": true, "data": { "gym": { "id": "g1", "name": "Iron Temple" }, "ownerToken": "jwt" }, "error": null }
```

### GET `/api/gyms/:gymId`
Headers: `Authorization: Bearer <token>`
Response:
```json
{ "success": true, "data": { "name": "Obsidian Gym", "location": "Canggu Bali", "memberCount": 5, "currentCompetition": {}, "currentPrize": "Monthly Bodybuilding Crown" }, "error": null }
```

## Cron Jobs
- Daily at `00:00`: avatar inactivity decay, supplement expiry, streak shield handling.
- Monthly at `1st 00:01`: close active competitions, create new competition per gym, reset `currentMonthXp`.

## Business rules implemented
- XP and GymCoins are separate currencies.
- Check-in is limited to one per calendar day.
- Battle only inside same gym and cannot self-challenge.
- Cosmetic items cannot be re-purchased.
- Supplements can be re-purchased.
- Avatar class/body stage auto-recalculated after progression changes.
- All routes except `/api/auth/register`, `/api/auth/login`, `/api/avatar/face-options` require JWT.
- Avatar creation is required for app routes through middleware guard.

## Seed Contents
- 1 gym: Obsidian Gym, Canggu Bali
- 5 users: Carlos, Marcos, Ayu, Dimas, Sofia
- 10 shop items
- 20 check-ins, 10 purchases, 3 battles
- 1 active current-month competition
