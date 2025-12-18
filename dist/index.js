
// CORS Headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Response helper
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
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
    // Normalize path: remove trailing slash if present (except root)
    const path = url.pathname.endsWith('/') && url.pathname.length > 1 
      ? url.pathname.slice(0, -1) 
      : url.pathname;

    try {
      // --- AUTH ---
      
      // Signup
      if (path === '/api/signup' && request.method === 'POST') {
        const body = await request.json();
        const { username, password } = body;
        
        if (!username || !password) return errorResponse("Missing credentials", 400);

        // Check if user exists
        const existingUser = await env.USERS_KV.get(username);
        if (existingUser) return errorResponse("Username already exists", 400);

        const newUser = { ...body, createdAt: Date.now() };
        await env.USERS_KV.put(username, JSON.stringify(newUser));

        return jsonResponse({ message: "User created successfully", success: true }, 201);
      }

      // Login
      if (path === '/api/login' && request.method === 'POST') {
        const { username, password } = await request.json();
        
        const userRaw = await env.USERS_KV.get(username);
        if (!userRaw) return errorResponse("Invalid credentials", 401);

        const user = JSON.parse(userRaw);
        if (user.password !== password) return errorResponse("Invalid credentials", 401);

        return jsonResponse({ message: "Login successful", success: true });
      }

      // Change Password
      if (path === '/api/change-password' && request.method === 'POST') {
        const { username, oldPassword, newPassword } = await request.json();

        if (!username || !oldPassword || !newPassword) return errorResponse("Missing fields", 400);

        const userRaw = await env.USERS_KV.get(username);
        if (!userRaw) return errorResponse("User not found", 404);

        const user = JSON.parse(userRaw);
        if (user.password !== oldPassword) return errorResponse("Invalid old password", 401);

        user.password = newPassword;
        await env.USERS_KV.put(username, JSON.stringify(user));

        return jsonResponse({ message: "Password updated successfully", success: true });
      }

      // Get User Profile
      // GET /api/user/:username
      if (path.startsWith('/api/user/') && request.method === 'GET') {
        const username = path.split('/').pop();
        const userRaw = await env.USERS_KV.get(username);
        if (!userRaw) return errorResponse("User not found", 404);
        
        const user = JSON.parse(userRaw);
        // Return only safe fields
        return jsonResponse({
            username: user.username,
            role: user.role,
            profile: user.profile || {}
        });
      }

      // Update User Profile
      // POST /api/update-profile
      if (path === '/api/update-profile' && request.method === 'POST') {
          const { username, role, profile } = await request.json();
          
          if (!username) return errorResponse("Username is required", 400);
          
          const userRaw = await env.USERS_KV.get(username);
          if (!userRaw) return errorResponse("User not found", 404);
          
          const user = JSON.parse(userRaw);
          
          // Update fields
          if (role) user.role = role;
          if (profile) user.profile = { ...user.profile, ...profile };
          
          await env.USERS_KV.put(username, JSON.stringify(user));
          
          return jsonResponse({ message: "Profile updated successfully", success: true });
      }

      // --- DATA ---

      // Fetch Projects
      // GET /api/projects/:username
      if (path.startsWith('/api/projects/') && request.method === 'GET') {
        const username = path.split('/').pop(); // Extract username from end
        
        const dataRaw = await env.PROJECT_DATA_KV.get(username);
        const projects = dataRaw ? JSON.parse(dataRaw).projects : [];

        return jsonResponse(projects);
      }

      // Consolidate Projects
      // POST /api/consolidate/:username
      if (path.startsWith('/api/consolidate/') && request.method === 'POST') {
        const username = path.split('/').pop();
        const { filters } = await request.json();

        // 1. Get Requester User
        const requesterRaw = await env.USERS_KV.get(username);
        if (!requesterRaw) return errorResponse("User not found", 404);
        const requester = JSON.parse(requesterRaw);
        
        // 2. Check if Requester is Public (Prerequisite)
        if (!requester.profile || !requester.profile.isPublic) {
             return errorResponse("Your profile must be set to Public to use this feature.", 403);
        }

        const role = requester.role || 'Common user';
        const { country, plant, team } = requester.profile || {};

        // 3. List all users
        const userList = await env.USERS_KV.list();
        const consolidatedProjects = [];

        // 4. Iterate and Filter
        for (const key of userList.keys) {
            const targetUsername = key.name;
            if (targetUsername === username) continue; // Skip self

            const targetUserRaw = await env.USERS_KV.get(targetUsername);
            if (!targetUserRaw) continue;
            const targetUser = JSON.parse(targetUserRaw);

            // Target must be public
            if (!targetUser.profile || !targetUser.profile.isPublic) continue;

            // Apply Privilege Logic
            let hasAccess = false;
            
            // Check based on role
            // 'Privilege level 4' -> All
            if (role === 'Privilege level 4') {
                hasAccess = true;
            }
            // 'Privilege level 3' -> Same Country
            else if (role === 'Privilege level 3') {
                if (country && targetUser.profile.country === country) hasAccess = true;
            }
            // 'Privilege level 2' -> Same Country, Plant
            else if (role === 'Privilege level 2') {
                if (country && plant && targetUser.profile.country === country && targetUser.profile.plant === plant) hasAccess = true;
            }
            // 'Privilege level 1' -> Same Country, Plant, Team
            else if (role === 'Privilege level 1') {
                if (country && plant && team && targetUser.profile.country === country && targetUser.profile.plant === plant && targetUser.profile.team === team) hasAccess = true;
            }
            // 'Common user' -> No access
            
            if (hasAccess) {
                // Apply Optional Filters (if provided)
                if (filters) {
                    if (filters.countries && filters.countries.length > 0) {
                        if (!targetUser.profile.country || !filters.countries.includes(targetUser.profile.country)) continue;
                    }
                    if (filters.plants && filters.plants.length > 0) {
                        if (!targetUser.profile.plant || !filters.plants.includes(targetUser.profile.plant)) continue;
                    }
                    if (filters.teams && filters.teams.length > 0) {
                        if (!targetUser.profile.team || !filters.teams.includes(targetUser.profile.team)) continue;
                    }
                }

                // Fetch projects for this target user
                const projectDataRaw = await env.PROJECT_DATA_KV.get(targetUsername);
                if (projectDataRaw) {
                    const data = JSON.parse(projectDataRaw);
                    if (data.projects && Array.isArray(data.projects)) {
                        // Filter Projects based on Privacy and Program Linkage
                        const filteredProjects = data.projects.filter(p => {
                            // 1. Criteria: Verify if project itself is public. Otherwise, do not consolidate.
                            // (Treat undefined as public for backward compatibility)
                            if (p.isPublic === false) return false;

                            // 2. Check Program Linkage Filter (if provided)
                            if (filters && filters.programLinkage) {
                                // Exact match or partial? User said "list all 'Program linkage' values for selection", implying exact match from a list.
                                // But since we implemented text input, let's do case-insensitive comparison or exact.
                                // Let's do exact match for now as it's cleaner for "selection" logic.
                                if (p.programLinkage !== filters.programLinkage) return false;
                            }

                            return true;
                        });

                        consolidatedProjects.push(...filteredProjects);
                    }
                }
            }
        }

        return jsonResponse(consolidatedProjects);
      }

      // AI Chat
      // POST /api/ai/chat
      if (path === '/api/ai/chat' && request.method === 'POST') {
          const { messages, model } = await request.json();
          
          if (!messages || !Array.isArray(messages)) {
              return errorResponse("Messages array is required", 400);
          }

          // Use the external multi-model worker
          const workerUrl = "https://multi-model-worker.study-llm.me/chat";
          // Default to deepseek, but allow override
          const selectedModel = model || "deepseek";

          try {
              const aiResponse = await fetch(workerUrl, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'User-Agent': 'LightGantt-Worker/1.0'
                  },
                  body: JSON.stringify({
                      model: selectedModel,
                      messages: messages,
                      stream: false
                  })
              });

              if (!aiResponse.ok) {
                  const errorText = await aiResponse.text();
                  console.error("AI Worker Error:", errorText);
                  return errorResponse(`AI Provider Error: ${aiResponse.statusText}`, aiResponse.status);
              }

              const aiData = await aiResponse.json();
              // Support both standard OpenAI format and the simplified format if the worker changes
              const reply = aiData.choices?.[0]?.message?.content || aiData.output || "No response from AI.";

              return jsonResponse({ response: reply, success: true });
          } catch (fetchError) {
              console.error("Fetch Error:", fetchError);
              return errorResponse("Failed to connect to AI service", 502);
          }
      }

      // Save Projects
      // POST /api/projects
      if (path === '/api/projects' && request.method === 'POST') {
        const { username, projects } = await request.json();

        if (!username) return errorResponse("Username is required", 400);

        // We store the whole object, similar to how we did in MongoDB/LocalStorage
        // Or just the projects array. Let's wrap it to allow metadata later.
        const data = { username, projects, updatedAt: Date.now() };
        await env.PROJECT_DATA_KV.put(username, JSON.stringify(data));

        return jsonResponse({ message: "Projects synced successfully", success: true });
      }

      return errorResponse(`Not Found: ${path}`, 404);

    } catch (err) {
      console.error(err);
      return errorResponse(err.message);
    }
  },
};
