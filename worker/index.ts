export interface Env {
  BOWLER_DATA: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'POST' && url.pathname === '/signup') {
      try {
        const data = await request.json() as any;
        const { username, password, email } = data;

        if (!username || !password) {
          return new Response(JSON.stringify({ success: false, error: 'Username and password are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if user exists
        const existingUser = await env.BOWLER_DATA.get(`auth:user:${username}`);
        if (existingUser) {
          return new Response(JSON.stringify({ success: false, error: 'User already exists' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const userId = crypto.randomUUID();
        const userProfile = { ...data, id: userId, password: undefined }; // Don't return password

        // Save auth data
        await env.BOWLER_DATA.put(`auth:user:${username}`, JSON.stringify({ password, userId }));
        // Save profile
        await env.BOWLER_DATA.put(`user:${userId}:profile`, JSON.stringify(userProfile));

        return new Response(JSON.stringify({ success: true, user: userProfile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (request.method === 'POST' && url.pathname === '/login') {
      try {
        const data = await request.json() as any;
        const { username, password } = data;

        if (!username || !password) {
          return new Response(JSON.stringify({ success: false, error: 'Username and password are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const authDataStr = await env.BOWLER_DATA.get(`auth:user:${username}`);
        if (!authDataStr) {
           return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const authData = JSON.parse(authDataStr);
        if (authData.password !== password) {
           return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const userProfileStr = await env.BOWLER_DATA.get(`user:${authData.userId}:profile`);
        const userProfile = userProfileStr ? JSON.parse(userProfileStr) : { username, id: authData.userId };

        return new Response(JSON.stringify({ success: true, user: userProfile }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    if (request.method === 'POST' && url.pathname === '/logout') {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'POST' && url.pathname === '/save') {
      try {
        const data = await request.json() as { bowlers: any[], a3Cases: any[], userId: string };
        const { bowlers, a3Cases, userId } = data;

        if (!userId) {
           return new Response(JSON.stringify({ success: false, error: 'User ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Save bowlers
        if (bowlers && Array.isArray(bowlers)) {
          for (const bowler of bowlers) {
            await env.BOWLER_DATA.put(`user:${userId}:bowler:${bowler.id}`, JSON.stringify(bowler));
          }
        }

        // Save A3 Cases
        if (a3Cases && Array.isArray(a3Cases)) {
          for (const a3 of a3Cases) {
            await env.BOWLER_DATA.put(`user:${userId}:a3:${a3.id}`, JSON.stringify(a3));
          }
        }

        return new Response(JSON.stringify({ success: true, message: 'Data saved successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (request.method === 'GET' && url.pathname === '/load') {
      const userId = url.searchParams.get('userId');

      if (!userId) {
        return new Response(JSON.stringify({ success: false, error: 'User ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const bowlers: any[] = [];
        const a3Cases: any[] = [];

        // List keys for the user
        const bowlerList = await env.BOWLER_DATA.list({ prefix: `user:${userId}:bowler:` });
        for (const key of bowlerList.keys) {
          const value = await env.BOWLER_DATA.get(key.name);
          if (value) {
            bowlers.push(JSON.parse(value));
          }
        }

        const a3List = await env.BOWLER_DATA.list({ prefix: `user:${userId}:a3:` });
        for (const key of a3List.keys) {
          const value = await env.BOWLER_DATA.get(key.name);
          if (value) {
            a3Cases.push(JSON.parse(value));
          }
        }

        return new Response(JSON.stringify({ success: true, bowlers, a3Cases }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
