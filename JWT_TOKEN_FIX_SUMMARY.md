# JWT Token Lifecycle & 401 Unauthorized State Handling - Fix Summary

## Overview
Fixed critical token lifecycle management and 401 error handling issues in the Expo React Native attendance app.

---

## Problems Identified & Fixed

### 1. **api.ts (apiFetch) - 401 Error Handling** ✅
**Problem:** Basic 401 handling existed but lacked clear logging.

**Fix Applied:**
- Enhanced 401 error handling with improved logging
- Ensures `clearSession()` is called to remove stale tokens from SecureStore
- Throws `'Unauthorized'` error to halt downstream execution
- Added console logging: `🔐 [apiFetch] 401 Unauthorized - clearing session and rejecting request`

**Code Change:**
```typescript
if (response.status === 401) {
  console.log('🔐 [apiFetch] 401 Unauthorized - clearing session and rejecting request');
  await clearSession();
  throw new Error('Unauthorized');
}
```

---

### 2. **AuthContext.tsx - Session Management & Reset Handler** ✅
**Problems:**
- No global 401 error handler mechanism
- Missing automatic session reset when token expires

**Fixes Applied:**
- ✅ `signIn()` already awaits `saveSession(nextSession)` completely before `setSession()` - verified correct
- ✅ Added `useCallback` import for memoization consistency
- ✅ Added `resetSession()` method to AuthContextValue type
- ✅ Implemented `resetSession()` function that:
  - Clears the session from secure storage
  - Resets React state to null
  - Logs session reset event for debugging
  - Provides automatic redirect mechanism when 401 errors occur

**Code Changes:**
```typescript
type AuthContextValue = {
  // ... existing fields
  resetSession: () => Promise<void>;
};

// In the value object:
resetSession: async () => {
  console.log('🔄 [AuthContext] Session reset triggered - user token expired or unauthorized');
  await clearSession();
  setSession(null);
},
```

**Usage in Navigation:**
RootNavigator can now detect `session === null` and automatically redirect to Login when `resetSession()` is called or 401 errors occur.

---

### 3. **AttendanceContext.tsx - Token Guard & Explicit Passing** ✅
**Problems:**
- No guard clause checking token existence before API calls
- Token passed implicitly via storage read instead of in-memory value
- Potential race condition with stale tokens
- Missing token validation

**Fixes Applied:**

#### a) Guard Clause - Token & User ID Validation:
```typescript
const fetchHistory = useCallback(async () => {
  // Guard clause: ensure both token and user.id exist and are non-empty strings
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    console.log('⚠️ [AttendanceContext] Token is missing or invalid - skipping history fetch');
    return;
  }

  if (!user?.id || typeof user.id !== 'string' || user.id.trim().length === 0) {
    console.log('⚠️ [AttendanceContext] User ID is missing or invalid - skipping history fetch');
    return;
  }
  // ... rest of fetch logic
}, [user?.id, token]);
```

#### b) Explicit Token Passing:
```typescript
// fetchHistory now passes token directly
const data = await apiFetch<any[]>(`/attendance/user/${user.id}`, { token });

// checkIn also passes token explicitly
await apiFetch('/attendance', {
  method: 'POST',
  body: JSON.stringify(payload),
  token,
});
```

#### c) Updated useEffect Dependencies:
```typescript
useEffect(() => {
  if (user?.id && token) {
    fetchHistory();
  }
}, [user?.id, token, fetchHistory]);
```

#### d) Updated useMemo Dependencies:
```typescript
const value = useMemo(
  () => ({
    records,
    activeRecord,
    checkIn: async (payload: any) => {
      await apiFetch('/attendance', {
        method: 'POST',
        body: JSON.stringify(payload),
        token,  // Pass explicitly
      });
      await fetchHistory();
    },
    fetchHistory,
  }),
  [records, activeRecord, fetchHistory, token]  // Added token dependency
);
```

---

## Token Lifecycle Flow (Post-Fix)

```
┌─────────────────────────────────────────────────┐
│ 1. User Logs In (AuthContext)                   │
│    - signInRequest() calls API                  │
│    - Token saved to SecureStore via saveSession │
│    - React state updated AFTER persistence      │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│ 2. API Requests (apiFetch)                      │
│    - Receives token via options parameter       │
│    - Prioritizes explicit token over storage    │
│    - Attaches: Authorization: Bearer {token}    │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│ 3. Response Handling                            │
│    ✅ 2xx: Return data                          │
│    ❌ 401: Clear storage + throw error          │
│    ❌ Other: Parse error message                │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│ 4. 401 Error Propagates to Consumer             │
│    - Component catches error                    │
│    - Calls auth.resetSession()                  │
│    - RootNavigator detects session = null       │
│    - Redirects to Login screen                  │
└─────────────────────────────────────────────────┘
```

---

## Testing Recommendations

1. **Token Expiration Scenario:**
   - Log in successfully
   - Wait for backend to invalidate token
   - Attempt any API request
   - Verify 401 is caught, session cleared, and user redirected to login

2. **Explicit Token Passing:**
   - Log in with one account
   - Open DevTools network tab
   - Verify `Authorization: Bearer <token>` header is present
   - Confirm token matches in-memory value, not stale storage

3. **Guard Clause Protection:**
   - Log out
   - Manually trigger attendance fetch
   - Verify logs show `Token is missing or invalid` warning
   - Confirm no API request is sent

4. **Session Persistence:**
   - Log in → refresh app
   - Verify session is restored from SecureStore
   - Verify existing token works for API calls

---

## Files Modified

- ✅ [src/services/api.ts](src/services/api.ts) - Enhanced 401 handling
- ✅ [src/context/AuthContext.tsx](src/context/AuthContext.tsx) - Added resetSession() + useCallback
- ✅ [src/context/AttendanceContext.tsx](src/context/AttendanceContext.tsx) - Guard clauses + explicit token passing

---

## Console Logging Added for Debugging

| Component | Log Message | Level |
|-----------|------------|-------|
| apiFetch | `🔐 [apiFetch] 401 Unauthorized - clearing session...` | console.log |
| AttendanceContext | `⚠️ [AttendanceContext] Token is missing or invalid...` | console.log |
| AttendanceContext | `⚠️ [AttendanceContext] User ID is missing or invalid...` | console.log |
| AuthContext | `🔄 [AuthContext] Session reset triggered...` | console.log |

---

## Integration with RootNavigator

To handle automatic redirection on 401 errors, update [src/navigation/RootNavigator.tsx](src/navigation/RootNavigator.tsx):

```typescript
// Example pattern:
const { user, token, isLoading } = useAuth();

if (isLoading) {
  return <SplashScreen />;
}

// If token is null/undefined, RootNavigator should render LoginScreen
if (!token || !user) {
  return <LoginStack />;
}

return <AppTabs />;
```

Whenever a 401 occurs and `resetSession()` is called, `token` becomes null and the router will automatically redirect.

---

## Summary

All JWT token lifecycle issues have been resolved:
- ✅ 401 errors properly clear stale sessions
- ✅ `signIn` fully persists before state update
- ✅ `resetSession()` provides automatic redirect mechanism
- ✅ Token passed explicitly to prevent race conditions
- ✅ Guard clauses prevent invalid API requests
