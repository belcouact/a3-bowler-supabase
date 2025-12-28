var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// index.ts
var index_default = {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method === "POST" && url.pathname === "/save") {
      try {
        const data = await request.json();
        const { bowlers, a3Cases, userId, dashboardMarkdown, dashboardTitle, dashboardMindmaps, activeMindmapId, dashboardSettings } = data;
        if (!userId) {
          return new Response(JSON.stringify({ success: false, error: "User ID is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const dashboardPayload = {};
        if (dashboardMarkdown !== void 0) dashboardPayload.content = dashboardMarkdown;
        if (dashboardTitle !== void 0) dashboardPayload.title = dashboardTitle;
        if (dashboardMindmaps !== void 0 && Array.isArray(dashboardMindmaps)) {
          const enrichedMindmaps = dashboardMindmaps.map((m, index) => {
            const id = typeof m.id === "string" && m.id.length > 0 ? m.id : typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : `mm-${Date.now()}-${index}`;
            return {
              id,
              title: typeof m.title === "string" ? m.title : "",
              description: typeof m.description === "string" ? m.description : "",
              markdown: typeof m.markdown === "string" ? m.markdown : "",
              createdAt: typeof m.createdAt === "string" ? m.createdAt : (/* @__PURE__ */ new Date()).toISOString(),
              updatedAt: typeof m.updatedAt === "string" ? m.updatedAt : void 0
            };
          });
          dashboardPayload.mindmaps = enrichedMindmaps;
        }
        if (dashboardSettings && typeof dashboardSettings === "object") {
          dashboardPayload.settings = dashboardSettings;
        }
        if (activeMindmapId !== void 0) dashboardPayload.activeMindmapId = activeMindmapId;
        if (Object.keys(dashboardPayload).length > 0) {
          await env.BOWLER_DATA.put(
            `user:${userId}:dashboard`,
            JSON.stringify(dashboardPayload)
          );
        }
        if (bowlers && Array.isArray(bowlers)) {
          const existingList = await env.BOWLER_DATA.list({ prefix: `user:${userId}:bowler:` });
          const existingKeys = new Set(existingList.keys.map((k) => k.name));
          const keysToKeep = new Set(bowlers.map((b) => `user:${userId}:bowler:${b.id}`));
          for (const key of existingKeys) {
            if (!keysToKeep.has(key)) {
              await env.BOWLER_DATA.delete(key);
            }
          }
          for (let i = 0; i < bowlers.length; i++) {
            const bowler = bowlers[i];
            const bowlerToSave = {
              ...bowler,
              userId,
              // Ensure sequence is saved in the record as well (as 'order')
              order: i
            };
            if (bowlerToSave.metrics && Array.isArray(bowlerToSave.metrics)) {
              bowlerToSave.metrics = bowlerToSave.metrics.map((m) => ({
                ...m,
                targetMeetingRule: m.targetMeetingRule || "gte",
                definition: m.definition || "",
                owner: m.owner || ""
              }));
            }
            await env.BOWLER_DATA.put(`user:${userId}:bowler:${bowler.id}`, JSON.stringify(bowlerToSave));
          }
        }
        if (a3Cases && Array.isArray(a3Cases)) {
          const existingList = await env.BOWLER_DATA.list({ prefix: `user:${userId}:a3:` });
          const existingKeys = new Set(existingList.keys.map((k) => k.name));
          const keysToKeep = new Set(a3Cases.map((a) => `user:${userId}:a3:${a.id}`));
          for (const key of existingKeys) {
            if (!keysToKeep.has(key)) {
              await env.BOWLER_DATA.delete(key);
            }
          }
          for (const a3 of a3Cases) {
            const a3ToSave = { ...a3, userId };
            await env.BOWLER_DATA.put(`user:${userId}:a3:${a3.id}`, JSON.stringify(a3ToSave));
          }
        }
        return new Response(JSON.stringify({
          success: true,
          message: "Data saved successfully",
          debug_userId: userId
          // Echo back userId for verification
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    if (request.method === "POST" && url.pathname === "/consolidate") {
      try {
        const { tags } = await request.json();
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
          return new Response(JSON.stringify({ success: false, error: "Tags list is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const normalizedTags = tags.map((t) => typeof t === "string" ? t.trim().toLowerCase() : "").filter((t) => t.length > 0);
        if (normalizedTags.length === 0) {
          return new Response(JSON.stringify({ success: false, error: "Tags list is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const allBowlers = [];
        const allA3Cases = [];
        let cursor = void 0;
        let listComplete = false;
        const visibilityCache = /* @__PURE__ */ new Map();
        const resolveIsPublic = /* @__PURE__ */ __name(async (userKey) => {
          if (!userKey) {
            return false;
          }
          if (visibilityCache.has(userKey)) {
            return visibilityCache.get(userKey);
          }
          try {
            const encodedUsername = encodeURIComponent(userKey).replace(/%40/g, "@");
            const res = await fetch(`https://login.study-llm.me/user/${encodedUsername}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json"
              }
            });
            if (!res.ok) {
              visibilityCache.set(userKey, false);
              return false;
            }
            const data = await res.json();
            const profile = data && data.user && data.user.profile ? data.user.profile : {};
            const isPublic = typeof profile.isPublic === "boolean" ? profile.isPublic : true;
            visibilityCache.set(userKey, isPublic);
            return isPublic;
          } catch {
            visibilityCache.set(userKey, false);
            return false;
          }
        }, "resolveIsPublic");
        while (!listComplete) {
          const list = await env.BOWLER_DATA.list({ prefix: "user:", cursor });
          cursor = list.cursor;
          listComplete = list.list_complete;
          const bowlerKeys = list.keys.filter((k) => k.name.includes(":bowler:"));
          if (bowlerKeys.length > 0) {
            const batchPromises = bowlerKeys.map((key) => env.BOWLER_DATA.get(key.name, "json"));
            const batchResults = await Promise.all(batchPromises);
            for (const data of batchResults) {
              if (data && typeof data === "object") {
                const bowler = data;
                const userKey = bowler.userId || bowler.userAccountId;
                const isPublic = await resolveIsPublic(userKey);
                if (!isPublic) {
                  continue;
                }
                if (bowler.tag) {
                  const bowlerTags = String(bowler.tag).split(",").map((t) => t.trim()).filter((t) => t.length > 0);
                  const bowlerTagsLower = bowlerTags.map((t) => t.toLowerCase());
                  const hasMatch = bowlerTagsLower.some((t) => normalizedTags.includes(t));
                  if (hasMatch) {
                    allBowlers.push(bowler);
                  }
                }
              }
            }
          }
          const a3Keys = list.keys.filter((k) => k.name.includes(":a3:"));
          if (a3Keys.length > 0) {
            const batchPromises = a3Keys.map((key) => env.BOWLER_DATA.get(key.name, "json"));
            const batchResults = await Promise.all(batchPromises);
            for (const data of batchResults) {
              if (data && typeof data === "object") {
                const a3 = data;
                const userKey = a3.userId || a3.userAccountId;
                const isPublic = await resolveIsPublic(userKey);
                if (!isPublic) {
                  continue;
                }
                if (a3.tag) {
                  const a3Tags = String(a3.tag).split(",").map((t) => t.trim()).filter((t) => t.length > 0);
                  const a3TagsLower = a3Tags.map((t) => t.toLowerCase());
                  const hasMatch = a3TagsLower.some((t) => normalizedTags.includes(t));
                  if (hasMatch) {
                    allA3Cases.push(a3);
                  }
                }
              }
            }
          }
        }
        const sortFn = /* @__PURE__ */ __name((a, b) => {
          if (a.userId !== b.userId) {
            return (a.userId || "").localeCompare(b.userId || "");
          }
          const orderA = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
          const orderB = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        }, "sortFn");
        allBowlers.sort(sortFn);
        allA3Cases.sort(sortFn);
        return new Response(JSON.stringify({ success: true, bowlers: allBowlers, a3Cases: allA3Cases }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    if (request.method === "GET" && url.pathname === "/admin/kv-list") {
      try {
        const items = [];
        let cursor = void 0;
        let listComplete = false;
        while (!listComplete) {
          const list = await env.BOWLER_DATA.list({ cursor });
          cursor = list.cursor;
          listComplete = list.list_complete;
          for (const key of list.keys) {
            const name = key.name;
            const parts = name.split(":");
            let userId = null;
            let kind = null;
            let entityId = null;
            if (parts.length >= 3 && parts[0] === "user") {
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
              entityId
            });
          }
        }
        return new Response(JSON.stringify({ success: true, items }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    if (request.method === "POST" && url.pathname === "/admin/kv-delete") {
      try {
        const body = await request.json();
        const keys = Array.isArray(body.keys) ? body.keys : [];
        if (keys.length === 0) {
          return new Response(JSON.stringify({ success: false, error: "No keys provided" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const uniqueKeys = Array.from(new Set(keys));
        await Promise.all(uniqueKeys.map((name) => env.BOWLER_DATA.delete(name)));
        return new Response(JSON.stringify({ success: true, deleted: uniqueKeys.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    if (request.method === "GET" && url.pathname === "/all-a3") {
      try {
        const allA3Cases = [];
        let cursor = void 0;
        let listComplete = false;
        const profileCache = /* @__PURE__ */ new Map();
        const resolveProfile = /* @__PURE__ */ __name(async (userKey) => {
          if (!userKey) {
            return { isPublic: false };
          }
          if (profileCache.has(userKey)) {
            return profileCache.get(userKey);
          }
          try {
            const encodedUsername = encodeURIComponent(userKey).replace(/%40/g, "@");
            const res = await fetch(`https://login.study-llm.me/user/${encodedUsername}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json"
              }
            });
            if (!res.ok) {
              const fallback = { isPublic: false };
              profileCache.set(userKey, fallback);
              return fallback;
            }
            const data = await res.json();
            const profile = data && data.user && data.user.profile ? data.user.profile : {};
            const isPublic = typeof profile.isPublic === "boolean" ? profile.isPublic : true;
            const plant = typeof profile.plant === "string" && profile.plant.trim().length > 0 ? profile.plant.trim() : void 0;
            const result = { isPublic, plant };
            profileCache.set(userKey, result);
            return result;
          } catch {
            const fallback = { isPublic: false };
            profileCache.set(userKey, fallback);
            return fallback;
          }
        }, "resolveProfile");
        while (!listComplete) {
          const list = await env.BOWLER_DATA.list({ prefix: "user:", cursor });
          cursor = list.cursor;
          listComplete = list.list_complete;
          const a3Keys = list.keys.filter((k) => k.name.includes(":a3:"));
          if (a3Keys.length > 0) {
            const batchPromises = a3Keys.map(
              (key) => env.BOWLER_DATA.get(key.name, "json")
            );
            const batchResults = await Promise.all(batchPromises);
            const userKeys = [];
            for (const data of batchResults) {
              if (data && typeof data === "object") {
                const a3 = data;
                const userKey = a3.userId || a3.userAccountId;
                if (userKey) {
                  userKeys.push(userKey);
                }
              }
            }
            const uniqueUserKeys = Array.from(new Set(userKeys));
            await Promise.all(uniqueUserKeys.map((userKey) => resolveProfile(userKey)));
            for (const data of batchResults) {
              if (data && typeof data === "object") {
                const a3 = data;
                const userKey = a3.userId || a3.userAccountId;
                const profile = await resolveProfile(userKey);
                if (!profile.isPublic) {
                  continue;
                }
                const enriched = {
                  ...a3,
                  plant: profile.plant
                };
                allA3Cases.push(enriched);
              }
            }
          }
        }
        allA3Cases.sort((a, b) => {
          const userA = a.userId || a.userAccountId || "";
          const userB = b.userId || b.userAccountId || "";
          if (userA !== userB) {
            return userA.localeCompare(userB);
          }
          const startA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const startB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return startA - startB;
        });
        return new Response(JSON.stringify({ success: true, a3Cases: allA3Cases }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    if (request.method === "GET" && url.pathname === "/load") {
      const userId = url.searchParams.get("userId");
      if (!userId) {
        return new Response(JSON.stringify({ success: false, error: "User ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      try {
        const bowlers = [];
        const a3Cases = [];
        let dashboardMarkdown;
        let dashboardTitle;
        let dashboardMindmaps;
        let activeMindmapId;
        let dashboardSettings;
        const dashboardRaw = await env.BOWLER_DATA.get(`user:${userId}:dashboard`);
        if (dashboardRaw) {
          try {
            const parsed = JSON.parse(dashboardRaw);
            if (typeof parsed === "string") {
              dashboardMarkdown = parsed;
            } else if (parsed && typeof parsed === "object") {
              dashboardMarkdown = parsed.content ?? "";
              dashboardTitle = parsed.title ?? "";
              if (Array.isArray(parsed.mindmaps)) {
                dashboardMindmaps = parsed.mindmaps;
              }
              if (typeof parsed.activeMindmapId === "string") {
                activeMindmapId = parsed.activeMindmapId;
              }
              if (parsed.settings && typeof parsed.settings === "object") {
                dashboardSettings = parsed.settings;
              } else if (parsed.dashboardSettings && typeof parsed.dashboardSettings === "object") {
                dashboardSettings = parsed.dashboardSettings;
              }
            }
          } catch (e) {
            dashboardMarkdown = dashboardRaw;
          }
        }
        const bowlerListPromise = env.BOWLER_DATA.list({ prefix: `user:${userId}:bowler:` });
        const a3ListPromise = env.BOWLER_DATA.list({ prefix: `user:${userId}:a3:` });
        const [bowlerList, a3List] = await Promise.all([bowlerListPromise, a3ListPromise]);
        const bowlerKeys = bowlerList.keys.map((k) => k.name);
        const a3Keys = a3List.keys.map((k) => k.name);
        const batchSize = 32;
        for (let i = 0; i < bowlerKeys.length; i += batchSize) {
          const slice = bowlerKeys.slice(i, i + batchSize);
          const batch = await Promise.all(
            slice.map((name) => env.BOWLER_DATA.get(name, "json"))
          );
          for (const data of batch) {
            if (data && typeof data === "object") {
              const record = data;
              if (record.userId === userId || record.userAccountId === userId) {
                bowlers.push(record);
              } else {
                bowlers.push(record);
              }
            }
          }
        }
        bowlers.sort((a, b) => {
          const orderA = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
          const orderB = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
        for (let i = 0; i < a3Keys.length; i += batchSize) {
          const slice = a3Keys.slice(i, i + batchSize);
          const batch = await Promise.all(
            slice.map((name) => env.BOWLER_DATA.get(name, "json"))
          );
          for (const data of batch) {
            if (data && typeof data === "object") {
              const record = data;
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
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
