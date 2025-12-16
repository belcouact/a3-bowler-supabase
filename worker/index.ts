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
        const data = await request.json() as { bowlers: any[], a3Cases: any[] };
        const { bowlers, a3Cases } = data;

        // Save bowlers
        if (bowlers && Array.isArray(bowlers)) {
          for (const bowler of bowlers) {
            await env.BOWLER_DATA.put(`bowler:${bowler.id}`, JSON.stringify(bowler));
          }
        }

        // Save A3 Cases
        if (a3Cases && Array.isArray(a3Cases)) {
          for (const a3 of a3Cases) {
            await env.BOWLER_DATA.put(`a3:${a3.id}`, JSON.stringify(a3));
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

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
