### Using auth-worker from other apps

The `auth-worker` is a JSON HTTP API hosted at `https://login.study-llm.me`. You can call it from any app (frontend or backend) using standard HTTPS requests.

- **Base URL:** `https://login.study-llm.me`
- **Content-Type:** `application/json`
- **CORS:** Configured with `Access-Control-Allow-Origin: *`, so it can be called directly from browsers.

#### Login (POST /login)

```ts
async function login(username: string, password: string) {
  const res = await fetch('https://login.study-llm.me/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Login failed');

  // data.user contains id, username, role, profile
  const user = data.user;
  // e.g. store in localStorage or your own session
  return user;
}
```

#### Get user profile (GET /user/:username)

```ts
async function getUserProfile(username: string) {
  const res = await fetch(`https://login.study-llm.me/user/${encodeURIComponent(username)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to load user');
  return data.user; // { username, role, profile }
}
```

#### Update user profile (POST /update-profile)

```ts
async function updateUserProfile(
  username: string,
  opts: { role?: string; profile?: { country?: string; plant?: string; team?: string; isPublic?: boolean } }
) {
  const res = await fetch('https://login.study-llm.me/update-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, ...opts })
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update profile');
}
```

#### Change password (POST /change-password)

```ts
async function changePassword(username: string, oldPassword: string, newPassword: string) {
  const res = await fetch('https://login.study-llm.me/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, oldPassword, newPassword })
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to change password');
}
```

#### Signup (POST /signup)

```ts
async function signup(username: string, password: string, role = 'Common user', profile: any = {}) {
  const res = await fetch('https://login.study-llm.me/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role, profile })
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Signup failed');
  return data.userId; // generated UUID
}
```

#### Logout (POST /logout)

```ts
async function logout() {
  await fetch('https://login.study-llm.me/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  // Clear your own app session/local storage here.
}