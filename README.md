# Attendance & Login System

Expo (managed) + TypeScript attendance app using React Navigation, React Native Paper, React Hook Form/Zod, SecureStore, and Expo Location.

## Run it

1. Copy `.env.example` to `.env` and point `EXPO_PUBLIC_API_URL` at your HTTPS backend.
2. Install compatible Expo packages: `npx expo install`.
3. Run `npm start`.

The login endpoint must accept `POST /auth/login` with `{ email, password }` and return:

```json
{ "token": "jwt", "user": { "id": "u_1", "name": "Jane Doe", "email": "jane@example.com", "role": "Security Officer" } }
```

## Structure

```
src/
  context/       Auth and local attendance state
  navigation/    auth-gated native stack and app tabs
  screens/       Login, dashboard, history, and profile views
  services/      HTTPS auth client and SecureStore persistence
  types/         shared domain models
```

GPS is collected only at check-in. The app validates permission and an accuracy threshold locally; submit the coordinates to your backend and validate the organization’s geofence there before authoritatively creating the attendance record.
# guard-attendence-app
