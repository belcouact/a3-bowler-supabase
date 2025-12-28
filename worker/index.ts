export interface Env {
  BOWLER_DATA: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
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
        const data = await request.json() as {
          bowlers: any[];
          a3Cases: any[];
          userId: string;
          dashboardMarkdown?: string;
          dashboardTitle?: string;
          dashboardMindmaps?: any[];
          activeMindmapId?: string;
          dashboardSettings?: { aiModel?: string };
        };
        const { bowlers, a3Cases, userId, dashboardMarkdown, dashboardTitle, dashboardMindmaps, activeMindmapId, dashboardSettings } = data;

        if (!userId) {
           return new Response(JSON.stringify({ success: false, error: 'User ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const dashboardPayload: any = {};
        if (dashboardMarkdown !== undefined) dashboardPayload.content = dashboardMarkdown;
        if (dashboardTitle !== undefined) dashboardPayload.title = dashboardTitle;

        if (dashboardMindmaps !== undefined && Array.isArray(dashboardMindmaps)) {
          const enrichedMindmaps = dashboardMindmaps.map((m, index) => {
            const id =
              typeof m.id === 'string' && m.id.length > 0
                ? m.id
                : (typeof (globalThis as any).crypto?.randomUUID === 'function'
                    ? (globalThis as any).crypto.randomUUID()
                    : `mm-${Date.now()}-${index}`);

            return {
              id,
              title: typeof m.title === 'string' ? m.title : '',
              description: typeof m.description === 'string' ? m.description : '',
              markdown: typeof m.markdown === 'string' ? m.markdown : '',
              createdAt: typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString(),
              updatedAt: typeof m.updatedAt === 'string' ? m.updatedAt : undefined
            };
          });
          dashboardPayload.mindmaps = enrichedMindmaps;
        }

        if (dashboardSettings && typeof dashboardSettings === 'object') {
          dashboardPayload.settings = dashboardSettings;
        }

        if (activeMindmapId !== undefined) dashboardPayload.activeMindmapId = activeMindmapId;

        if (Object.keys(dashboardPayload).length > 0) {
          await env.BOWLER_DATA.put(
            `user:${userId}:dashboard`,
            JSON.stringify(dashboardPayload)
          );
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

        const normalizedTags = tags
          .map(t => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
          .filter(t => t.length > 0);

        if (normalizedTags.length === 0) {
          return new Response(JSON.stringify({ success: false, error: 'Tags list is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const allBowlers: any[] = [];
        const allA3Cases: any[] = [];
        let cursor: string | undefined = undefined;
        let listComplete = false;
        const visibilityCache = new Map<string, boolean>();

        const resolveIsPublic = async (userKey: string | undefined | null): Promise<boolean> => {
          if (!userKey) {
            return false;
          }
          if (visibilityCache.has(userKey)) {
            return visibilityCache.get(userKey) as boolean;
          }
          try {
            const encodedUsername = encodeURIComponent(userKey).replace(/%40/g, '@');
            const res = await fetch(`https://login.study-llm.me/user/${encodedUsername}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            if (!res.ok) {
              visibilityCache.set(userKey, false);
              return false;
            }
            const data = await res.json() as any;
            const profile = data && data.user && data.user.profile ? data.user.profile : {};
            const isPublic =
              typeof profile.isPublic === 'boolean' ? profile.isPublic : true;
            visibilityCache.set(userKey, isPublic);
            return isPublic;
          } catch {
            visibilityCache.set(userKey, false);
            return false;
          }
        };
        
        while (!listComplete) {
            const list: any = await env.BOWLER_DATA.list({ prefix: 'user:', cursor });
            cursor = list.cursor;
            listComplete = list.list_complete;
            
            const bowlerKeys = list.keys.filter((k: any) => k.name.includes(':bowler:'));
            
            if (bowlerKeys.length > 0) {
                 const batchPromises = bowlerKeys.map((key: any) => env.BOWLER_DATA.get(key.name, 'json'));
                 const batchResults = await Promise.all(batchPromises);
                 
                 for (const data of batchResults) {
                    if (data && typeof data === 'object') {
                        const bowler = data as any;
                        const userKey = bowler.userId || bowler.userAccountId;
                        const isPublic = await resolveIsPublic(userKey);
                        if (!isPublic) {
                          continue;
                        }
                        if (bowler.tag) {
                            const bowlerTags = String(bowler.tag)
                              .split(',')
                              .map((t: string) => t.trim())
                              .filter((t: string) => t.length > 0);
                            const bowlerTagsLower = bowlerTags.map((t: string) => t.toLowerCase());
                            const hasMatch = bowlerTagsLower.some((t: string) => normalizedTags.includes(t));
                            if (hasMatch) {
                                allBowlers.push(bowler);
                            }
                        }
                    }
                 }
            }

            const a3Keys = list.keys.filter((k: any) => k.name.includes(':a3:'));

            if (a3Keys.length > 0) {
                 const batchPromises = a3Keys.map((key: any) => env.BOWLER_DATA.get(key.name, 'json'));
                 const batchResults = await Promise.all(batchPromises);
                 
                 for (const data of batchResults) {
                    if (data && typeof data === 'object') {
                        const a3 = data as any;
                        const userKey = a3.userId || a3.userAccountId;
                        const isPublic = await resolveIsPublic(userKey);
                        if (!isPublic) {
                          continue;
                        }
                        if (a3.tag) {
                            const a3Tags = String(a3.tag)
                              .split(',')
                              .map((t: string) => t.trim())
                              .filter((t: string) => t.length > 0);
                            const a3TagsLower = a3Tags.map((t: string) => t.toLowerCase());
                            const hasMatch = a3TagsLower.some((t: string) => normalizedTags.includes(t));
                            if (hasMatch) {
                                allA3Cases.push(a3);
                            }
                        }
                    }
                 }
            }
        }
        
        const sortFn = (a: any, b: any) => {
             if (a.userId !== b.userId) {
                 return (a.userId || '').localeCompare(b.userId || '');
             }
             const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
             const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
             return orderA - orderB;
        };
        
        allBowlers.sort(sortFn);
        allA3Cases.sort(sortFn);

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

    if (request.method === 'GET' && url.pathname === '/admin/kv-list') {
      try {
        const items: any[] = [];
        let cursor: string | undefined = undefined;
        let listComplete = false;

        while (!listComplete) {
          const list: any = await env.BOWLER_DATA.list({ cursor });
          cursor = list.cursor;
          listComplete = list.list_complete;

          for (const key of list.keys) {
            const name = key.name as string;
            const parts = name.split(':');
            let userId: string | null = null;
            let kind: string | null = null;
            let entityId: string | null = null;

            if (parts.length >= 3 && parts[0] === 'user') {
              userId = parts[1] || null;
              kind = parts[2] || null;
              if (parts.length >= 4) {
                entityId = parts[3] || null;
              }
            } else if (parts.length >= 1) {
              kind = parts[0] || null;
              if (parts.length >= 2) {
                entityId = parts[1] || null;
              }
            }

            items.push({
              key: name,
              userId,
              kind,
              entityId,
            });
          }
        }

        return new Response(JSON.stringify({ success: true, items }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (request.method === 'POST' && url.pathname === '/admin/kv-delete') {
      try {
        const body = await request.json() as { keys?: string[] };
        const keys = Array.isArray(body.keys) ? body.keys : [];
        if (keys.length === 0) {
          return new Response(JSON.stringify({ success: false, error: 'No keys provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const uniqueKeys = Array.from(new Set(keys));
        await Promise.all(uniqueKeys.map(name => env.BOWLER_DATA.delete(name)));

        return new Response(JSON.stringify({ success: true, deleted: uniqueKeys.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (request.method === 'GET' && url.pathname === '/all-a3') {
      try {
        const allA3Cases: any[] = [];
        let cursor: string | undefined = undefined;
        let listComplete = false;
        const profileCache = new Map<string, { isPublic: boolean; plant?: string }>();

        const resolveProfile = async (
          userKey: string | undefined | null,
        ): Promise<{ isPublic: boolean; plant?: string }> => {
          if (!userKey) {
            return { isPublic: false };
          }
          if (profileCache.has(userKey)) {
            return profileCache.get(userKey) as { isPublic: boolean; plant?: string };
          }
          try {
            const encodedUsername = encodeURIComponent(userKey).replace(/%40/g, '@');
            const res = await fetch(`https://login.study-llm.me/user/${encodedUsername}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            if (!res.ok) {
              const fallback = { isPublic: false as const };
              profileCache.set(userKey, fallback);
              return fallback;
            }
            const data = (await res.json()) as any;
            const profile = data && data.user && data.user.profile ? data.user.profile : {};
            const isPublic =
              typeof profile.isPublic === 'boolean' ? profile.isPublic : true;
            const plant =
              typeof profile.plant === 'string' && profile.plant.trim().length > 0
                ? profile.plant.trim()
                : undefined;
            const result = { isPublic, plant };
            profileCache.set(userKey, result);
            return result;
          } catch {
            const fallback = { isPublic: false as const };
            profileCache.set(userKey, fallback);
            return fallback;
          }
        };

        while (!listComplete) {
          const list: any = await env.BOWLER_DATA.list({ prefix: 'user:', cursor });
          cursor = list.cursor;
          listComplete = list.list_complete;

          const a3Keys = list.keys.filter((k: any) => k.name.includes(':a3:'));

          if (a3Keys.length > 0) {
            const batchPromises = a3Keys.map((key: any) =>
              env.BOWLER_DATA.get(key.name, 'json' as any),
            );
            const batchResults = await Promise.all(batchPromises);

            const userKeys: string[] = [];
            for (const data of batchResults) {
              if (data && typeof data === 'object') {
                const a3 = data as any;
                const userKey = (a3.userId || a3.userAccountId) as string | undefined;
                if (userKey) {
                  userKeys.push(userKey);
                }
              }
            }

            const uniqueUserKeys = Array.from(new Set(userKeys));
            await Promise.all(uniqueUserKeys.map(userKey => resolveProfile(userKey)));

            for (const data of batchResults) {
              if (data && typeof data === 'object') {
                const a3 = data as any;
                const userKey = a3.userId || a3.userAccountId;
                const profile = await resolveProfile(userKey);
                if (!profile.isPublic) {
                  continue;
                }
                const enriched = {
                  ...a3,
                  plant: profile.plant,
                };
                allA3Cases.push(enriched);
              }
            }
          }
        }

        allA3Cases.sort((a: any, b: any) => {
          const userA = (a.userId || a.userAccountId || '') as string;
          const userB = (b.userId || b.userAccountId || '') as string;
          if (userA !== userB) {
            return userA.localeCompare(userB);
          }
          const startA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const startB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return startA - startB;
        });

        return new Response(JSON.stringify({ success: true, a3Cases: allA3Cases }), {
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
        let dashboardMarkdown: string | undefined;
        let dashboardTitle: string | undefined;
        let dashboardMindmaps: any[] | undefined;
        let activeMindmapId: string | undefined;
        let dashboardSettings: any | undefined;

        // Load dashboard markdown and title
        const dashboardRaw = await env.BOWLER_DATA.get(`user:${userId}:dashboard`);
        if (dashboardRaw) {
          try {
            const parsed = JSON.parse(dashboardRaw as string);
            if (typeof parsed === 'string') {
              dashboardMarkdown = parsed;
            } else if (parsed && typeof parsed === 'object') {
              dashboardMarkdown = parsed.content ?? '';
              dashboardTitle = parsed.title ?? '';
              if (Array.isArray(parsed.mindmaps)) {
                dashboardMindmaps = parsed.mindmaps;
              }
              if (typeof parsed.activeMindmapId === 'string') {
                activeMindmapId = parsed.activeMindmapId;
              }
              if (parsed.settings && typeof parsed.settings === 'object') {
                dashboardSettings = parsed.settings;
              } else if (parsed.dashboardSettings && typeof parsed.dashboardSettings === 'object') {
                dashboardSettings = parsed.dashboardSettings;
              }
            }
          } catch (e) {
            dashboardMarkdown = dashboardRaw as string;
          }
        }

        // List keys for the user
        // Ensure we are reading data that was written with the same userId
        const bowlerListPromise = env.BOWLER_DATA.list({ prefix: `user:${userId}:bowler:` });
        const a3ListPromise = env.BOWLER_DATA.list({ prefix: `user:${userId}:a3:` });

        const [bowlerList, a3List] = await Promise.all([bowlerListPromise, a3ListPromise]);

        const bowlerKeys = bowlerList.keys.map((k: any) => k.name);
        const a3Keys = a3List.keys.map((k: any) => k.name);

        const batchSize = 32;

        for (let i = 0; i < bowlerKeys.length; i += batchSize) {
          const slice = bowlerKeys.slice(i, i + batchSize);
          const batch = await Promise.all(
            slice.map(name => env.BOWLER_DATA.get(name, 'json' as any))
          );
          for (const data of batch) {
            if (data && typeof data === 'object') {
              const record: any = data;
              if (record.userId === userId || record.userAccountId === userId) {
                bowlers.push(record);
              } else {
                bowlers.push(record);
              }
            }
          }
        }

        // Sort by order field
        bowlers.sort((a, b) => {
            const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
            const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });

        for (let i = 0; i < a3Keys.length; i += batchSize) {
          const slice = a3Keys.slice(i, i + batchSize);
          const batch = await Promise.all(
            slice.map(name => env.BOWLER_DATA.get(name, 'json' as any))
          );
          for (const data of batch) {
            if (data && typeof data === 'object') {
              const record: any = data;
              if (record.userId === userId || record.userAccountId === userId) {
                a3Cases.push(record);
              } else {
                a3Cases.push(record);
              }
            }
          }
        }

        return new Response(JSON.stringify({
          success: true,
          bowlers,
          a3Cases,
          dashboardMarkdown,
          dashboardTitle,
          dashboardMindmaps,
          activeMindmapId,
          dashboardSettings
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

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
