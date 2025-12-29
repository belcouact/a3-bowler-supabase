import { authService } from './authService';

const API_BASE_URL = 'https://bowler-worker.study-llm.me';
const EMAIL_API_BASE_URL = 'https://email-worker.study-llm.me';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
const SUPABASE_STORAGE_URL = `${SUPABASE_URL}/storage/v1`;
const A3_IMAGES_BUCKET = 'a3-bowler';
const A3_IMAGES_FOLDER = 'images';

const ensureSupabaseConfigured = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }
};

const getSupabaseHeaders = (contentType?: string): HeadersInit => {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  return headers;
};

export const dataService = {
  async saveData(
    bowlers: any[],
    a3Cases: any[],
    userId: string,
    dashboardMarkdown?: string,
    dashboardTitle?: string,
    dashboardMindmaps?: any[],
    activeMindmapId?: string | null,
    dashboardSettings?: any
  ) {
    ensureSupabaseConfigured();

    const trimmedUserId = userId.trim();

    const normalizedDashboardSettings = dashboardSettings || {};
    const dashboardRow = {
      user_id: trimmedUserId,
      markdown: dashboardMarkdown ?? '',
      title: dashboardTitle ?? '',
      mindmaps: dashboardMindmaps ?? [],
      active_mindmap_id: activeMindmapId ?? null,
      settings: normalizedDashboardSettings,
    };

    const enrichedBowlers = (bowlers || []).map((bowler, index) => {
      const baseMetrics = Array.isArray(bowler.metrics) ? bowler.metrics : [];
      const normalizedMetrics = baseMetrics.map((m: any) => ({
        ...m,
        targetMeetingRule: m.targetMeetingRule || 'gte',
        definition: m.definition || '',
        owner: m.owner || '',
      }));

      return {
        id: bowler.id,
        user_id: trimmedUserId,
        name: bowler.name,
        description: bowler.description ?? null,
        group: bowler.group ?? null,
        champion: bowler.champion ?? null,
        commitment: bowler.commitment ?? null,
        tag: bowler.tag ?? null,
        metric_start_date: bowler.metricStartDate ?? null,
        metrics: normalizedMetrics,
        status_color: bowler.statusColor ?? null,
        order_index: index,
      };
    });

    const enrichedA3Cases = (a3Cases || []).map(a3 => ({
      id: a3.id,
      user_id: trimmedUserId,
      title: a3.title,
      description: a3.description ?? null,
      owner: a3.owner ?? null,
      group: a3.group ?? null,
      tag: a3.tag ?? null,
      linked_metric_ids: a3.linkedMetricIds ?? null,
      priority: a3.priority ?? null,
      start_date: a3.startDate ?? null,
      end_date: a3.endDate ?? null,
      status: a3.status ?? null,
      problem_statement: a3.problemStatement ?? null,
      problem_context: a3.problemContext ?? null,
      results: a3.results ?? null,
      mind_map_nodes: a3.mindMapNodes ?? null,
      mind_map_text: a3.mindMapText ?? null,
      mind_map_scale: a3.mindMapScale ?? null,
      mind_map_canvas_height: a3.mindMapCanvasHeight ?? null,
      root_cause: a3.rootCause ?? null,
      action_plan_tasks: a3.actionPlanTasks ?? null,
      data_analysis_observations: a3.dataAnalysisObservations ?? null,
      data_analysis_images: a3.dataAnalysisImages ?? null,
      data_analysis_canvas_height: a3.dataAnalysisCanvasHeight ?? null,
      result_images: a3.resultImages ?? null,
      result_canvas_height: a3.resultCanvasHeight ?? null,
    }));

    const dashboardUrl = new URL(`${SUPABASE_REST_URL}/dashboards`);
    dashboardUrl.searchParams.set('on_conflict', 'user_id');

    const dashboardResponse = await fetch(dashboardUrl.toString(), {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders('application/json'),
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify([dashboardRow]),
    });

    if (!dashboardResponse.ok) {
      throw new Error('Failed to save dashboard to Supabase');
    }

    const bowlerIdsUrl = new URL(`${SUPABASE_REST_URL}/bowlers`);
    bowlerIdsUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
    bowlerIdsUrl.searchParams.set('select', 'id');

    const existingBowlersResponse = await fetch(bowlerIdsUrl.toString(), {
      method: 'GET',
      headers: getSupabaseHeaders(),
    });

    if (!existingBowlersResponse.ok) {
      throw new Error('Failed to load existing bowlers from Supabase');
    }

    const existingBowlersJson = (await existingBowlersResponse.json()) as { id: string }[];
    const existingBowlerIds = new Set((existingBowlersJson || []).map(b => b.id));
    const incomingBowlerIds = new Set(enrichedBowlers.map(b => b.id as string));

    const bowlerIdsToDelete = Array.from(existingBowlerIds).filter(id => !incomingBowlerIds.has(id));

    const bowlerUpsertUrl = new URL(`${SUPABASE_REST_URL}/bowlers`);
    bowlerUpsertUrl.searchParams.set('on_conflict', 'id');

    if (enrichedBowlers.length > 0) {
      const upsertResponse = await fetch(bowlerUpsertUrl.toString(), {
        method: 'POST',
        headers: {
          ...getSupabaseHeaders('application/json'),
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(enrichedBowlers),
      });

      if (!upsertResponse.ok) {
        throw new Error('Failed to save bowlers to Supabase');
      }
    }

    if (bowlerIdsToDelete.length > 0) {
      const bowlerDeleteUrl = new URL(`${SUPABASE_REST_URL}/bowlers`);
      bowlerDeleteUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
      const inList = bowlerIdsToDelete.map(id => `"${id}"`).join(',');
      bowlerDeleteUrl.searchParams.set('id', `in.(${inList})`);

      const deleteResponse = await fetch(bowlerDeleteUrl.toString(), {
        method: 'DELETE',
        headers: getSupabaseHeaders(),
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete removed bowlers from Supabase');
      }
    }

    const a3IdsUrl = new URL(`${SUPABASE_REST_URL}/a3_cases`);
    a3IdsUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
    a3IdsUrl.searchParams.set('select', 'id');

    const existingA3Response = await fetch(a3IdsUrl.toString(), {
      method: 'GET',
      headers: getSupabaseHeaders(),
    });

    if (!existingA3Response.ok) {
      throw new Error('Failed to load existing A3 cases from Supabase');
    }

    const existingA3Json = (await existingA3Response.json()) as { id: string }[];
    const existingA3Ids = new Set((existingA3Json || []).map(a => a.id));
    const incomingA3Ids = new Set(enrichedA3Cases.map(a => a.id as string));

    const a3IdsToDelete = Array.from(existingA3Ids).filter(id => !incomingA3Ids.has(id));

    const a3UpsertUrl = new URL(`${SUPABASE_REST_URL}/a3_cases`);
    a3UpsertUrl.searchParams.set('on_conflict', 'id');

    if (enrichedA3Cases.length > 0) {
      const upsertResponse = await fetch(a3UpsertUrl.toString(), {
        method: 'POST',
        headers: {
          ...getSupabaseHeaders('application/json'),
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(enrichedA3Cases),
      });

      if (!upsertResponse.ok) {
        throw new Error('Failed to save A3 cases to Supabase');
      }
    }

    if (a3IdsToDelete.length > 0) {
      const a3DeleteUrl = new URL(`${SUPABASE_REST_URL}/a3_cases`);
      a3DeleteUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
      const inList = a3IdsToDelete.map(id => `"${id}"`).join(',');
      a3DeleteUrl.searchParams.set('id', `in.(${inList})`);

      const deleteResponse = await fetch(a3DeleteUrl.toString(), {
        method: 'DELETE',
        headers: getSupabaseHeaders(),
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete removed A3 cases from Supabase');
      }
    }

    return {
      success: true,
    };
  },

  async loadData(userId: string) {
    ensureSupabaseConfigured();

    const trimmedUserId = userId.trim();

    try {
      const bowlersUrl = new URL(`${SUPABASE_REST_URL}/bowlers`);
      bowlersUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
      bowlersUrl.searchParams.set('select', '*');
      bowlersUrl.searchParams.set('order', 'order_index.asc');

      const a3Url = new URL(`${SUPABASE_REST_URL}/a3_cases`);
      a3Url.searchParams.set('user_id', `eq.${trimmedUserId}`);
      a3Url.searchParams.set('select', '*');

      const dashboardUrl = new URL(`${SUPABASE_REST_URL}/dashboards`);
      dashboardUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
      dashboardUrl.searchParams.set('select', '*');

      const [bowlersResponse, a3Response, dashboardResponse] = await Promise.all([
        fetch(bowlersUrl.toString(), {
          method: 'GET',
          headers: getSupabaseHeaders(),
        }),
        fetch(a3Url.toString(), {
          method: 'GET',
          headers: getSupabaseHeaders(),
        }),
        fetch(dashboardUrl.toString(), {
          method: 'GET',
          headers: getSupabaseHeaders(),
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

      const mappedBowlers = (bowlersJson || []).map(row => ({
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

      const mappedA3Cases = (a3Json || []).map(row => ({
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
          : null;
      const rawDashboardSettings =
        dashboardRow && dashboardRow.settings && typeof dashboardRow.settings === 'object'
          ? dashboardRow.settings
          : {};

      return {
        success: true,
        bowlers: mappedBowlers,
        a3Cases: mappedA3Cases,
        dashboardMarkdown,
        dashboardTitle,
        dashboardMindmaps,
        activeMindmapId,
        dashboardSettings: rawDashboardSettings,
      };
    } catch (error) {
      console.error('Error in loadData:', error);
      return { success: false, bowlers: [], a3Cases: [] };
    }
  },

  async loadAllA3Cases() {
    ensureSupabaseConfigured();

    const a3Url = new URL(`${SUPABASE_REST_URL}/a3_cases`);
    a3Url.searchParams.set('select', '*');

    const response = await fetch(a3Url.toString(), {
      method: 'GET',
      headers: getSupabaseHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load global A3 cases from Supabase');
    }

    const a3Json = (await response.json()) as any[];

    const profileCache = new Map<string, { isPublic: boolean; plant?: string }>();

    const resolveProfile = async (userKey: string) => {
      if (!userKey) {
        return;
      }
      if (profileCache.has(userKey)) {
        return;
      }
      try {
        const response = await authService.getUser(userKey);
        const apiUser = (response as any).user || response;
        const profile = apiUser && apiUser.profile ? apiUser.profile : {};
        const isPublic =
          typeof profile.isPublic === 'boolean' ? profile.isPublic : true;
        const plant =
          typeof profile.plant === 'string' && profile.plant.trim().length > 0
            ? profile.plant.trim()
            : undefined;
        profileCache.set(userKey, { isPublic, plant });
      } catch {
        profileCache.set(userKey, { isPublic: false });
      }
    };

    const userKeys: string[] = [];
    (a3Json || []).forEach(row => {
      const key = typeof row.user_id === 'string' ? row.user_id : null;
      if (key && !userKeys.includes(key)) {
        userKeys.push(key);
      }
    });

    await Promise.all(userKeys.map(userKey => resolveProfile(userKey)));

    const a3Cases = (a3Json || [])
      .map(row => {
        const userId = typeof row.user_id === 'string' ? row.user_id : undefined;
        if (!userId) {
          return null;
        }
        const profile = profileCache.get(userId);
        if (!profile || !profile.isPublic) {
          return null;
        }
        return {
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
          userId,
          userAccountId: userId,
          plant: profile.plant,
        };
      })
      .filter(Boolean) as any[];

    a3Cases.sort((a: any, b: any) => {
      const userA = (a.userId || a.userAccountId || '') as string;
      const userB = (b.userId || b.userAccountId || '') as string;
      if (userA !== userB) {
        return userA.localeCompare(userB);
      }
      const startA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const startB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return startA - startB;
    });

    return {
      success: true,
      a3Cases,
    };
  },

  async loadA3Detail(userId: string, a3Id: string) {
    ensureSupabaseConfigured();

    const trimmedUserId = userId.trim();

    const url = new URL(`${SUPABASE_REST_URL}/a3_cases`);
    url.searchParams.set('user_id', `eq.${trimmedUserId}`);
    url.searchParams.set('id', `eq.${a3Id}`);
    url.searchParams.set(
      'select',
      [
        'data_analysis_images',
        'data_analysis_canvas_height',
        'result_images',
        'result_canvas_height',
      ].join(','),
    );

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getSupabaseHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load A3 detail from Supabase');
    }

    const rows = (await response.json()) as any[];
    const row = rows && rows.length > 0 ? rows[0] : null;

    if (!row) {
      return {
        success: true,
        dataAnalysisImages: [],
        resultImages: [],
      };
    }

    return {
      success: true,
      dataAnalysisImages: row.data_analysis_images ?? [],
      dataAnalysisCanvasHeight: row.data_analysis_canvas_height ?? undefined,
      resultImages: row.result_images ?? [],
      resultCanvasHeight: row.result_canvas_height ?? undefined,
    };
  },

  async uploadA3Image(userId: string, a3Id: string, file: Blob) {
    const imageId =
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    ensureSupabaseConfigured();

    const trimmedUserId = userId.trim();

    const mimeType = (file as any).type || 'image/webp';
    let extension = 'webp';
    if (mimeType === 'image/png') {
      extension = 'png';
    } else if (mimeType === 'image/jpeg') {
      extension = 'jpg';
    } else if (mimeType === 'image/gif') {
      extension = 'gif';
    } else if (mimeType === 'image/webp') {
      extension = 'webp';
    } else if (mimeType && mimeType.includes('/')) {
      extension = mimeType.split('/')[1];
    }

    const objectPath = `${A3_IMAGES_FOLDER}/${encodeURIComponent(
      trimmedUserId,
    )}/${encodeURIComponent(a3Id)}/${imageId}.${extension}`;

    const uploadUrl = `${SUPABASE_STORAGE_URL}/object/${encodeURIComponent(
      A3_IMAGES_BUCKET,
    )}/${objectPath}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: getSupabaseHeaders(mimeType),
      body: file,
    });

    if (!response.ok) {
      throw new Error('Failed to upload A3 image to Supabase Storage');
    }

    const publicUrl = `${SUPABASE_STORAGE_URL}/object/public/${encodeURIComponent(
      A3_IMAGES_BUCKET,
    )}/${objectPath}`;

    return {
      imageId,
      key: objectPath,
      url: publicUrl,
    };
  },

  async consolidateBowlers(tags: string[]) {
    ensureSupabaseConfigured();

    const normalizedTags = (tags || [])
      .map(t => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
      .filter(t => t.length > 0);

    if (normalizedTags.length === 0) {
      throw new Error('Tags list is required');
    }

    const bowlersUrl = new URL(`${SUPABASE_REST_URL}/bowlers`);
    bowlersUrl.searchParams.set('select', '*');

    const a3Url = new URL(`${SUPABASE_REST_URL}/a3_cases`);
    a3Url.searchParams.set('select', '*');

    const [bowlersResponse, a3Response] = await Promise.all([
      fetch(bowlersUrl.toString(), {
        method: 'GET',
        headers: getSupabaseHeaders(),
      }),
      fetch(a3Url.toString(), {
        method: 'GET',
        headers: getSupabaseHeaders(),
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

    const bowlers = (bowlersJson || [])
      .filter(row => matchesTags(row.tag))
      .map(row => ({
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
        userId: row.user_id ?? undefined,
        order: typeof row.order_index === 'number' ? row.order_index : undefined,
      }));

    const a3Cases = (a3Json || [])
      .filter(row => matchesTags(row.tag))
      .map(row => ({
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
        userId: row.user_id ?? undefined,
        userAccountId: row.user_id ?? undefined,
        order: undefined as number | undefined,
      }));

    bowlers.sort((a: any, b: any) => {
      if (a.userId !== b.userId) {
        return (a.userId || '').localeCompare(b.userId || '');
      }
      const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    a3Cases.sort((a: any, b: any) => {
      const userA = (a.userId || a.userAccountId || '') as string;
      const userB = (b.userId || b.userAccountId || '') as string;
      if (userA !== userB) {
        return userA.localeCompare(userB);
      }
      const startA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const startB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return startA - startB;
    });

    const strippedBowlers = bowlers.map(b => {
      const { userId: _userId, order: _order, ...rest } = b;
      return rest;
    });

    const strippedA3Cases = a3Cases.map(a => {
      const { userId: _userId, userAccountId: _userAccountId, order: _order, ...rest } = a;
      return rest;
    });

    return {
      success: true,
      bowlers: strippedBowlers,
      a3Cases: strippedA3Cases,
    };
  },

  async listKvItems() {
    const response = await fetch(`${API_BASE_URL}/admin/kv-list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load KV items');
    }

    return response.json();
  },

  async deleteKvItems(keys: string[]) {
    const uniqueKeys = Array.from(new Set(keys));
    const chunkSize = 200;
    let deletedTotal = 0;

    for (let i = 0; i < uniqueKeys.length; i += chunkSize) {
      const slice = uniqueKeys.slice(i, i + chunkSize);
      const response = await fetch(`${API_BASE_URL}/admin/kv-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keys: slice }),
      });

      if (!response.ok) {
        let message = 'Failed to delete KV items';
        try {
          const data = await response.json();
          if (data && typeof data.error === 'string') {
            message = data.error;
          }
        } catch (e) {
          void e;
        }
        throw new Error(message);
      }

      try {
        const data = await response.json() as any;
        if (data && typeof data.deleted === 'number') {
          deletedTotal += data.deleted;
        }
      } catch (e) {
        void e;
      }
    }

    return { success: true, deleted: deletedTotal };
  },

  async scheduleEmail(options: {
    userId?: string;
    recipients: string[];
    subject: string;
    body?: string;
    bodyHtml?: string;
    sendAt: string;
    mode?: 'manual' | 'autoSummary';
    aiModel?: string;
    fromName?: string;
    recurring?: boolean;
  }) {
    const response = await fetch(`${EMAIL_API_BASE_URL}/schedule-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      let message = 'Failed to schedule email';
      try {
        const data = await response.json();
        if (data && typeof data.error === 'string') {
          message = data.error;
        }
      } catch (e) {
        void e;
      }
      throw new Error(message);
    }

    return response.json();
  },

  async listScheduledEmails(userId: string) {
    const url = new URL(`${EMAIL_API_BASE_URL}/list-scheduled-emails`);
    url.searchParams.set('userId', userId);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let message = 'Failed to load scheduled emails';
      try {
        const data = await response.json();
        if (data && typeof data.error === 'string') {
          message = data.error;
        }
      } catch (e) {
        void e;
      }
      throw new Error(message);
    }

    return response.json();
  },

  async cancelScheduledEmail(userId: string, id: string) {
    const response = await fetch(`${EMAIL_API_BASE_URL}/cancel-scheduled-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, id }),
    });

    if (!response.ok) {
      let message = 'Failed to cancel scheduled email';
      try {
        const data = await response.json();
        if (data && typeof data.error === 'string') {
          message = data.error;
        }
      } catch (e) {
        void e;
      }
      throw new Error(message);
    }

    return response.json();
  },

  async sendEmailNow(options: {
    userId?: string;
    recipients: string[];
    subject: string;
    body: string;
    bodyHtml?: string;
    fromName?: string;
  }) {
    const response = await fetch(`${EMAIL_API_BASE_URL}/send-email-now`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      let message = 'Failed to send email';
      try {
        const data = await response.json();
        if (data && typeof data.error === 'string') {
          message = data.error;
        }
      } catch (e) {
        void e;
      }
      throw new Error(message);
    }

    return response.json();
  },
};
