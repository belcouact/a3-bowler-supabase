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
        const data = await request.json() as { bowlers: any[], a3Cases: any[], userId: string, dashboardMarkdown?: string };
        const { bowlers, a3Cases, userId, dashboardMarkdown } = data;

        if (!userId) {
           return new Response(JSON.stringify({ success: false, error: 'User ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Save Dashboard Markdown
        if (dashboardMarkdown !== undefined) {
          await env.BOWLER_DATA.put(`user:${userId}:dashboard`, JSON.stringify({ content: dashboardMarkdown }));
        }

        // Save bowlers
        if (bowlers && Array.isArray(bowlers)) {
          // 1. Get all existing bowler keys for this user
          const existingList = await env.BOWLER_DATA.list({ prefix: `user:${userId}:bowler:` });
          const existingKeys = new Set(existingList.keys.map((k: any) => k.name));
          
          // 2. Identify keys to keep (based on incoming payload)
          const keysToKeep = new Set(bowlers.map(b => `user:${userId}:bowler:${b.id}`));
          
          // 3. Delete keys that are not in the payload
          for (const key of existingKeys) {
            if (!keysToKeep.has(key as string)) {
              await env.BOWLER_DATA.delete(key as string);
            }
          }

          // 4. Update/Create items from payload
          for (let i = 0; i < bowlers.length; i++) {
            const bowler = bowlers[i];
            const bowlerToSave = { 
                ...bowler, 
                userId: userId,
                // Ensure sequence is saved in the record as well (as 'order')
                order: i 
            };
            
            // Ensure metrics have default fields if missing
            if (bowlerToSave.metrics && Array.isArray(bowlerToSave.metrics)) {
                bowlerToSave.metrics = bowlerToSave.metrics.map((m: any) => ({
                    ...m,
                    targetMeetingRule: m.targetMeetingRule || 'gte',
                    definition: m.definition || '',
                    owner: m.owner || ''
                }));
            }

            await env.BOWLER_DATA.put(`user:${userId}:bowler:${bowler.id}`, JSON.stringify(bowlerToSave));
          }
        }

        // Save A3 Cases
        if (a3Cases && Array.isArray(a3Cases)) {
           // 1. Get all existing A3 keys for this user
           const existingList = await env.BOWLER_DATA.list({ prefix: `user:${userId}:a3:` });
           const existingKeys = new Set(existingList.keys.map((k: any) => k.name));
           
           // 2. Identify keys to keep
           const keysToKeep = new Set(a3Cases.map(a => `user:${userId}:a3:${a.id}`));
           
           // 3. Delete keys that are not in the payload
           for (const key of existingKeys) {
             if (!keysToKeep.has(key as string)) {
               await env.BOWLER_DATA.delete(key as string);
             }
           }

          // 4. Update/Create items
          for (const a3 of a3Cases) {
            const a3ToSave = { ...a3, userId: userId };
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

    if (request.method === 'POST' && url.pathname === '/consolidate') {
      try {
        const { tags } = await request.json() as { tags: string[] };
        
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
             return new Response(JSON.stringify({ success: false, error: 'Tags list is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const allBowlers: any[] = [];
        const allA3Cases: any[] = [];
        let cursor: string | undefined = undefined;
        let listComplete = false;
        
        while (!listComplete) {
            const list: any = await env.BOWLER_DATA.list({ prefix: 'user:', cursor });
            cursor = list.cursor;
            listComplete = list.list_complete;
            
            // Filter for bowler keys
            const bowlerKeys = list.keys.filter((k: any) => k.name.includes(':bowler:'));
            
            if (bowlerKeys.length > 0) {
                 const batchPromises = bowlerKeys.map((key: any) => env.BOWLER_DATA.get(key.name, 'json'));
                 const batchResults = await Promise.all(batchPromises);
                 
                 for (const data of batchResults) {
                    if (data && typeof data === 'object') {
                        const bowler = data as any;
                        if (bowler.tag && tags.includes(bowler.tag)) {
                            allBowlers.push(bowler);
                        }
                    }
                 }
            }

            // Filter for A3 keys
            const a3Keys = list.keys.filter((k: any) => k.name.includes(':a3:'));

            if (a3Keys.length > 0) {
                 const batchPromises = a3Keys.map((key: any) => env.BOWLER_DATA.get(key.name, 'json'));
                 const batchResults = await Promise.all(batchPromises);
                 
                 for (const data of batchResults) {
                    if (data && typeof data === 'object') {
                        const a3 = data as any;
                        if (a3.tag && tags.includes(a3.tag)) {
                            allA3Cases.push(a3);
                        }
                    }
                 }
            }
        }
        
        return new Response(JSON.stringify({ success: true, bowlers: allBowlers, a3Cases: allA3Cases }), {
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
        // Ensure we are reading data that was written with the same userId
        const bowlerList = await env.BOWLER_DATA.list({ prefix: `user:${userId}:bowler:` });
        for (const key of bowlerList.keys) {
          const value = await env.BOWLER_DATA.get(key.name);
          if (value) {
            const data = JSON.parse(value);
            
            // Verify userId matches (though key prefix ensures this)
            if (data.userId === userId || data.userAccountId === userId) {
                bowlers.push(data);
            } else {
                // Fallback for old data or mismatch, still push if we trust the key
                bowlers.push(data); 
            }
          }
        }

        // Sort by order field
        bowlers.sort((a, b) => {
            const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
            const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });

        const a3List = await env.BOWLER_DATA.list({ prefix: `user:${userId}:a3:` });
        for (const key of a3List.keys) {
          const value = await env.BOWLER_DATA.get(key.name);
          if (value) {
            const data = JSON.parse(value);
             // Verify userId matches
            if (data.userId === userId || data.userAccountId === userId) {
                a3Cases.push(data);
            } else {
                 a3Cases.push(data);
            }
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
