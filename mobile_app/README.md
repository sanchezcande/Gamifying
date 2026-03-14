# Gamifying Mobile (Expo)

React Native + Expo app for the Gamifying backend.

## Run
1. `cd /Users/msg1234/Documents/Gamifying/mobile_app`
2. `npm install`
3. `npm start`
4. Open with Expo Go / iOS simulator / Android emulator.

## API
Configured in `src/services/apiService.js` with:
- `BASE_URL = http://localhost:3000/api`

If testing on Android emulator, localhost may need `10.0.2.2`.

## Main stack
- Expo (React Native)
- React Navigation (bottom tabs + stack)
- Provider (context state)
- Axios (10s timeout)
- Expo Secure Store (JWT)
- Moti animations

## Structure
- `src/navigation`: tabs + stacks
- `src/screens`: all app screens
- `src/providers`: auth/avatar/shop/battle/leaderboard state
- `src/services/apiService.js`: backend integration
- `src/components`: reusable UI widgets
- `src/theme/theme.js`: dark red/black design system
