export interface Env {
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_URL?: string;
}

const SUPABASE_PROJECT_ID = 'sellervptovbxfzkldtz';

const getSupabaseRestUrl = (env: Env) => {
  const base =
    env.SUPABASE_URL && env.SUPABASE_URL.trim().length > 0
      ? env.SUPABASE_URL.trim()
      : `https://${SUPABASE_PROJECT_ID}.supabase.co`;
  return `${base}/rest/v1`;
};

const getSupabaseHeaders = (env: Env, contentType?: string): Record<string, string> => {
  const key = env.SUPABASE_SERVICE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_KEY is not configured');
  }
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  return headers;
};

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

    if (request.method === 'GET' && url.pathname === '/a3-detail') {
      const userId = url.searchParams.get('userId');
      const a3Id = url.searchParams.get('a3Id');

      if (!userId || !a3Id) {
        return new Response(
          JSON.stringify({ success: false, error: 'userId and a3Id are required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      try {
        const trimmedUserId = userId.trim();

        const urlA3 = new URL(`${getSupabaseRestUrl(env)}/a3_cases`);
        urlA3.searchParams.set('user_id', `eq.${trimmedUserId}`);
        urlA3.searchParams.set('id', `eq.${a3Id}`);
        urlA3.searchParams.set(
          'select',
          [
            'data_analysis_images',
            'data_analysis_canvas_height',
            'result_images',
            'result_canvas_height',
          ].join(','),
        );

        const response = await fetch(urlA3.toString(), {
          method: 'GET',
          headers: getSupabaseHeaders(env),
        });

        if (!response.ok) {
          throw new Error('Failed to load A3 detail from Supabase');
        }

        const rows = (await response.json()) as any[];
        const row = rows && rows.length > 0 ? rows[0] : null;

        if (!row) {
          return new Response(
            JSON.stringify({ success: true, dataAnalysisImages: [], resultImages: [] }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          );
        }

        const detail = {
          dataAnalysisImages: row.data_analysis_images ?? [],
          dataAnalysisCanvasHeight: row.data_analysis_canvas_height ?? undefined,
          resultImages: row.result_images ?? [],
          resultCanvasHeight: row.result_canvas_height ?? undefined,
        };

        return new Response(JSON.stringify({ success: true, ...detail }), {
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

        const bowlersUrl = new URL(`${getSupabaseRestUrl(env)}/bowlers`);
        bowlersUrl.searchParams.set('select', '*');

        const a3Url = new URL(`${getSupabaseRestUrl(env)}/a3_cases`);
        a3Url.searchParams.set('select', '*');

        const [bowlersResponse, a3Response] = await Promise.all([
          fetch(bowlersUrl.toString(), {
            method: 'GET',
            headers: getSupabaseHeaders(env),
          }),
          fetch(a3Url.toString(), {
            method: 'GET',
            headers: getSupabaseHeaders(env),
          }),
        ]);

        if (!bowlersResponse.ok) {
          throw new Error('Failed to load bowlers from Supabase for consolidation');
        }

        if (!a3Response.ok) {
          throw new Error('Failed to load A3 cases from Supabase for consolidation');
        }

        const bowlersJson = (await bowlersResponse.json()) as any[];
        const a3Json = (await a3Response.json()) as any[];

        const matchesTags = (value: unknown): boolean => {
          if (!value) {
            return false;
          }
          const raw = String(value);
          const parts = raw
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
          if (parts.length === 0) {
            return false;
          }
          const lower = parts.map(t => t.toLowerCase());
          return lower.some(t => normalizedTags.includes(t));
        };

        for (const row of bowlersJson || []) {
          if (!matchesTags(row.tag)) {
            continue;
          }
          const userKey = row.user_id as string | undefined;
          const isPublic = await resolveIsPublic(userKey);
          if (!isPublic) {
            continue;
          }
          const order =
            typeof row.order_index === 'number' ? row.order_index : undefined;
          allBowlers.push({
            id: row.id,
            name: row.name,
            description: row.description ?? undefined,
            group: row.group ?? undefined,
            champion: row.champion ?? undefined,
            commitment: row.commitment ?? undefined,
            tag: row.tag ?? undefined,
            metricStartDate: row.metric_start_date ?? undefined,
            metrics: row.metrics ?? undefined,
            statusColor: row.status_color ?? undefined,
            userId: userKey,
            order,
          });
        }

        for (const row of a3Json || []) {
          if (!matchesTags(row.tag)) {
            continue;
          }
          const userKey = row.user_id as string | undefined;
          const isPublic = await resolveIsPublic(userKey);
          if (!isPublic) {
            continue;
          }
          allA3Cases.push({
            id: row.id,
            title: row.title,
            description: row.description ?? undefined,
            owner: row.owner ?? undefined,
            group: row.group ?? undefined,
            tag: row.tag ?? undefined,
            linkedMetricIds: row.linked_metric_ids ?? undefined,
            priority: row.priority ?? undefined,
            startDate: row.start_date ?? undefined,
            endDate: row.end_date ?? undefined,
            status: row.status ?? undefined,
            problemStatement: row.problem_statement ?? undefined,
            problemContext: row.problem_context ?? undefined,
            results: row.results ?? undefined,
            mindMapNodes: row.mind_map_nodes ?? undefined,
            mindMapText: row.mind_map_text ?? undefined,
            mindMapScale: row.mind_map_scale ?? undefined,
            mindMapCanvasHeight: row.mind_map_canvas_height ?? undefined,
            rootCause: row.root_cause ?? undefined,
            actionPlanTasks: row.action_plan_tasks ?? undefined,
            dataAnalysisObservations: row.data_analysis_observations ?? undefined,
            dataAnalysisImages: row.data_analysis_images ?? undefined,
            dataAnalysisCanvasHeight: row.data_analysis_canvas_height ?? undefined,
            resultImages: row.result_images ?? undefined,
            resultCanvasHeight: row.result_canvas_height ?? undefined,
            userId: userKey,
            userAccountId: userKey,
          });
        }

        const sortFn = (a: any, b: any) => {
          if (a.userId !== b.userId) {
            return (a.userId || '').localeCompare(b.userId || '');
          }
          const orderA =
            typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
          const orderB =
            typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        };

        allBowlers.sort(sortFn);
        allA3Cases.sort(sortFn);

        const strippedBowlers = allBowlers.map(b => {
          const { userId: _userId, order: _order, ...rest } = b;
          return rest;
        });

        const strippedA3Cases = allA3Cases.map(a => {
          const { userId: _userId, userAccountId: _userAccountId, ...rest } = a;
          return rest;
        });

        return new Response(JSON.stringify({ success: true, bowlers: strippedBowlers, a3Cases: strippedA3Cases }), {
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

        const a3Url = new URL(`${getSupabaseRestUrl(env)}/a3_cases`);
        a3Url.searchParams.set('select', '*');

        const a3Response = await fetch(a3Url.toString(), {
          method: 'GET',
          headers: getSupabaseHeaders(env),
        });

        if (!a3Response.ok) {
          throw new Error('Failed to load A3 cases from Supabase');
        }

        const a3Json = (await a3Response.json()) as any[];

        const userKeys: string[] = [];
        for (const row of a3Json) {
          const userKey = typeof row.user_id === 'string' ? row.user_id : undefined;
          if (userKey) {
            userKeys.push(userKey);
          }
        }

        const uniqueUserKeys = Array.from(new Set(userKeys));
        await Promise.all(uniqueUserKeys.map(userKey => resolveProfile(userKey)));

        for (const row of a3Json) {
          const userKey = typeof row.user_id === 'string' ? row.user_id : null;
          const profile = await resolveProfile(userKey);
          if (!profile.isPublic) {
            continue;
          }

          const a3 = {
            id: row.id,
            userId: userKey || undefined,
            title: row.title,
            description: row.description ?? undefined,
            owner: row.owner ?? undefined,
            group: row.group ?? undefined,
            tag: row.tag ?? undefined,
            linkedMetricIds: row.linked_metric_ids ?? undefined,
            priority: row.priority ?? undefined,
            startDate: row.start_date ?? undefined,
            endDate: row.end_date ?? undefined,
            status: row.status ?? undefined,
            problemStatement: row.problem_statement ?? undefined,
            problemContext: row.problem_context ?? undefined,
            results: row.results ?? undefined,
            mindMapNodes: row.mind_map_nodes ?? undefined,
            mindMapText: row.mind_map_text ?? undefined,
            mindMapScale: row.mind_map_scale ?? undefined,
            mindMapCanvasHeight: row.mind_map_canvas_height ?? undefined,
            rootCause: row.root_cause ?? undefined,
            actionPlanTasks: row.action_plan_tasks ?? undefined,
            dataAnalysisObservations: row.data_analysis_observations ?? undefined,
          };

          const enriched = {
            ...a3,
            plant: profile.plant,
          };
          allA3Cases.push(enriched);
        }

        allA3Cases.sort((a: any, b: any) => {
          const userA = (a.userId || '') as string;
          const userB = (b.userId || '') as string;
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
        const trimmedUserId = userId.trim();

        const bowlersUrl = new URL(`${getSupabaseRestUrl(env)}/bowlers`);
        bowlersUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
        bowlersUrl.searchParams.set('select', '*');
        bowlersUrl.searchParams.set('order', 'order_index.asc');

        const a3Url = new URL(`${getSupabaseRestUrl(env)}/a3_cases`);
        a3Url.searchParams.set('user_id', `eq.${trimmedUserId}`);
        a3Url.searchParams.set('select', '*');

        const dashboardUrl = new URL(`${getSupabaseRestUrl(env)}/dashboards`);
        dashboardUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
        dashboardUrl.searchParams.set('select', '*');

        const [bowlersResponse, a3Response, dashboardResponse] = await Promise.all([
          fetch(bowlersUrl.toString(), {
            method: 'GET',
            headers: getSupabaseHeaders(env),
          }),
          fetch(a3Url.toString(), {
            method: 'GET',
            headers: getSupabaseHeaders(env),
          }),
          fetch(dashboardUrl.toString(), {
            method: 'GET',
            headers: getSupabaseHeaders(env),
          }),
        ]);

        if (!bowlersResponse.ok) {
          throw new Error('Failed to load bowlers from Supabase');
        }

        if (!a3Response.ok) {
          throw new Error('Failed to load A3 cases from Supabase');
        }

        if (!dashboardResponse.ok && dashboardResponse.status !== 406 && dashboardResponse.status !== 404) {
          throw new Error('Failed to load dashboard from Supabase');
        }

        const bowlersJson = (await bowlersResponse.json()) as any[];
        const a3Json = (await a3Response.json()) as any[];
        const dashboardJson = dashboardResponse.ok ? ((await dashboardResponse.json()) as any[]) : [];

        const bowlers = (bowlersJson || []).map(row => ({
          id: row.id,
          name: row.name,
          description: row.description ?? undefined,
          group: row.group ?? undefined,
          champion: row.champion ?? undefined,
          commitment: row.commitment ?? undefined,
          tag: row.tag ?? undefined,
          metricStartDate: row.metric_start_date ?? undefined,
          metrics: row.metrics ?? undefined,
          statusColor: row.status_color ?? undefined,
        }));

        const a3Cases = (a3Json || []).map(row => ({
          id: row.id,
          title: row.title,
          description: row.description ?? undefined,
          owner: row.owner ?? undefined,
          group: row.group ?? undefined,
          tag: row.tag ?? undefined,
          linkedMetricIds: row.linked_metric_ids ?? undefined,
          priority: row.priority ?? undefined,
          startDate: row.start_date ?? undefined,
          endDate: row.end_date ?? undefined,
          status: row.status ?? undefined,
          problemStatement: row.problem_statement ?? undefined,
          problemContext: row.problem_context ?? undefined,
          results: row.results ?? undefined,
          mindMapNodes: row.mind_map_nodes ?? undefined,
          mindMapText: row.mind_map_text ?? undefined,
          mindMapScale: row.mind_map_scale ?? undefined,
          mindMapCanvasHeight: row.mind_map_canvas_height ?? undefined,
          rootCause: row.root_cause ?? undefined,
          actionPlanTasks: row.action_plan_tasks ?? undefined,
          dataAnalysisObservations: row.data_analysis_observations ?? undefined,
          dataAnalysisImages: row.data_analysis_images ?? undefined,
          dataAnalysisCanvasHeight: row.data_analysis_canvas_height ?? undefined,
          resultImages: row.result_images ?? undefined,
          resultCanvasHeight: row.result_canvas_height ?? undefined,
        }));

        const dashboardRow = dashboardJson && dashboardJson.length > 0 ? dashboardJson[0] : null;

        const dashboardMarkdown = dashboardRow?.markdown ?? '';
        const dashboardTitle = dashboardRow?.title ?? '';
        const dashboardMindmaps = Array.isArray(dashboardRow?.mindmaps) ? dashboardRow.mindmaps : [];
        const activeMindmapId =
          dashboardRow && typeof dashboardRow.active_mindmap_id === 'string'
            ? dashboardRow.active_mindmap_id
            : undefined;
        const dashboardSettings =
          dashboardRow && dashboardRow.settings && typeof dashboardRow.settings === 'object'
            ? dashboardRow.settings
            : {};

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
