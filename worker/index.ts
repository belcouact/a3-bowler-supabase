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
            const bowlerToSave = { ...bowler, userAccountId: userId };
            await env.BOWLER_DATA.put(`user:${userId}:bowler:${bowler.id}`, JSON.stringify(bowlerToSave));
          }
        }

        // Save A3 Cases
        if (a3Cases && Array.isArray(a3Cases)) {
          for (const a3 of a3Cases) {
            const a3ToSave = { ...a3, userAccountId: userId };
            await env.BOWLER_DATA.put(`user:${userId}:a3:${a3.id}`, JSON.stringify(a3ToSave));
          }
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Data saved successfully',
            debug_userId: userId // Echo back userId for verification
        }), {
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
