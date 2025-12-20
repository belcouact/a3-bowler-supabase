const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

function errorResponse(message, status = 500) {
  return jsonResponse({ error: message, success: false }, status);
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    // Normalize path
    const path = url.pathname.endsWith('/') && url.pathname.length > 1 
      ? url.pathname.slice(0, -1) 
      : url.pathname;

    try {
      // --- AUTH ENDPOINTS ---

      // POST /signup
      // Creates a new user account
      if (path === '/signup' && request.method === 'POST') {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return errorResponse("Invalid JSON body", 400);
        }

        const { username, password, role, profile, email } = body;
        
        if (!username || !password) return errorResponse("Missing username or password", 400);

        const trimmedUsername = String(username).trim();
        const trimmedPassword = String(password);

        // Password strength check
        if (trimmedPassword.length < 6) {
            return errorResponse("Password must be at least 6 characters", 400);
        }

        const finalProfile = {
            ...(profile || {}),
            ...(email ? { email } : {})
        };

        // Optional profile validation (if provided)
        if (profile) {
            const missingFields = [];
            if (!finalProfile.country) missingFields.push("country");
            if (!finalProfile.plant) missingFields.push("plant");
            if (!finalProfile.team) missingFields.push("team");

            if (missingFields.length > 0) {
                return errorResponse(`Missing profile fields: ${missingFields.join(", ")}`, 400);
            }
        }

        // Check if user exists
        const existingUser = await env.USERS_KV.get(trimmedUsername);
        if (existingUser) return errorResponse("Username already exists", 409);

        const newUser = { 
            id: crypto.randomUUID(),
            username: trimmedUsername, 
            password: trimmedPassword, 
            role: role || 'Common user', 
            profile: finalProfile,
            createdAt: Date.now() 
        };
        
        await env.USERS_KV.put(trimmedUsername, JSON.stringify(newUser));

        return jsonResponse({ message: "User created successfully", success: true, userId: newUser.id }, 201);
      }

      // POST /login
      // Verifies credentials
      if (path === '/login' && request.method === 'POST') {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return errorResponse("Invalid JSON body", 400);
        }

        const { username, password } = body;
        
        if (!username || !password) return errorResponse("Missing credentials", 400);

        const userRaw = await env.USERS_KV.get(username);
        if (!userRaw) return errorResponse("User not found", 404);

        const user = JSON.parse(userRaw);
        if (user.password !== password) return errorResponse("Incorrect password", 401);

        // Ensure user has an ID (Backfill for existing users)
        if (!user.id) {
            user.id = crypto.randomUUID();
            await env.USERS_KV.put(username, JSON.stringify(user));
        }

        // Return user info (excluding password)
        return jsonResponse({ 
            message: "Login successful", 
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                profile: user.profile
            }
        });
      }

      // POST /logout
      // Since we are stateless (no sessions), this is just a confirmation endpoint
      // for the client to call if they want to 'inform' the server, or for future expansion.
      if (path === '/logout' && request.method === 'POST') {
        return jsonResponse({ message: "Logged out successfully", success: true });
      }

      // POST /change-password
      if (path === '/change-password' && request.method === 'POST') {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return errorResponse("Invalid JSON body", 400);
        }

        const { username, oldPassword, newPassword } = body;

        if (!username || !oldPassword || !newPassword) return errorResponse("Missing fields", 400);

        const userRaw = await env.USERS_KV.get(username);
        if (!userRaw) return errorResponse("User not found", 404);

        const user = JSON.parse(userRaw);
        if (user.password !== oldPassword) return errorResponse("Invalid old password", 401);

        user.password = newPassword;
        await env.USERS_KV.put(username, JSON.stringify(user));

        return jsonResponse({ message: "Password updated successfully", success: true });
      }

      // POST /update-profile
      if (path === '/update-profile' && request.method === 'POST') {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return errorResponse("Invalid JSON body", 400);
        }

        const { username, role, profile } = body;

        if (!username) return errorResponse("Missing username", 400);

        const userRaw = await env.USERS_KV.get(username);
        if (!userRaw) return errorResponse("User not found", 404);

        const user = JSON.parse(userRaw);
        
        if (role) user.role = role;
        if (profile) user.profile = { ...user.profile, ...profile };
        
        await env.USERS_KV.put(username, JSON.stringify(user));

        return jsonResponse({ message: "Profile updated successfully", success: true });
      }

      // GET /user/:username
      // Verify user existence and get profile
      if (path.startsWith('/user/') && request.method === 'GET') {
        const username = path.split('/').pop();
        if (!username) return errorResponse("Username required", 400);

        const userRaw = await env.USERS_KV.get(username);
        if (!userRaw) return errorResponse("User not found", 404);
        
        const user = JSON.parse(userRaw);
        return jsonResponse({
            success: true,
            user: {
                username: user.username,
                role: user.role,
                profile: user.profile || {}
            }
        });
      }
      
      // Default
      return errorResponse("Not found", 404);

    } catch (err) {
      return errorResponse(err.message);
    }
  }
};
