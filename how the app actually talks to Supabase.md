Here’s how the app actually talks to Supabase for bowlers, A3 cases, and pictures, based on the current code.

---

**1. Big Picture**

- There is **no Supabase JS client**; everything uses plain `fetch` against:
  - REST API: `https://<project>.supabase.co/rest/v1`
  - Storage API: `https://<project>.supabase.co/storage/v1`
- Two main places handle Supabase:
  - Frontend service: [dataService](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts)
  - Cloudflare Worker: [worker/index.ts](file:///c:/functions/Trae/a3-bowler-supabase/worker/index.ts)
- Frontend uses environment vars:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` → `SUPABASE_REST_URL` and `SUPABASE_STORAGE_URL`.
- Workers use:
  - `SUPABASE_SERVICE_KEY`, `SUPABASE_URL` from the worker env.

Everything below is just different shapes of `fetch` calls to those endpoints.

---

**2. Bowler Data (table: `bowlers`)**

Types (frontend view of a bowler) from [types.ts](file:///c:/functions/Trae/a3-bowler-supabase/src/types.ts#L47-L58):

- `Bowler` has:
  - `id`, `name`
  - `description?`, `group?`, `champion?`, `commitment?`, `tag?`
  - `metricStartDate?`
  - `metrics?: Metric[]` (monthly data etc.)
  - `statusColor?`

These map to the Supabase `bowlers` table columns (DB-side naming) in [dataService.saveData](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts#L29-L107):

- For each bowler, we build a row:
  - `id` ← `bowler.id`
  - `user_id` ← current username (`trimmedUserId`)
  - `name` ← `bowler.name`
  - `description` ← `bowler.description ?? null`
  - `group` ← `bowler.group ?? null`
  - `champion` ← `bowler.champion ?? null`
  - `commitment` ← `bowler.commitment ?? null`
  - `tag` ← `bowler.tag ?? null` (used heavily for consolidation)
  - `metric_start_date` ← `bowler.metricStartDate ?? null`
  - `metrics` ← normalized `Metric[]`:
    - Ensures `targetMeetingRule`, `definition`, `owner` are always set.
  - `status_color` ← `bowler.statusColor ?? null`
  - `order_index` ← index in the current list (controls ordering in UI)

**Writing bowlers**

Inside `dataService.saveData`:

1. Ensure config exists (`ensureSupabaseConfigured`).
2. Upsert dashboard row (see section 4), then:
3. Load existing bowler IDs for this user:

   ```ts
   const bowlerIdsUrl = new URL(`${SUPABASE_REST_URL}/bowlers`);
   bowlerIdsUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
   bowlerIdsUrl.searchParams.set('select', 'id');
   // GET existing IDs
   ```

4. Compute `bowlerIdsToDelete` as those in DB but not in current local state.
5. Upsert the new/edited bowlers:

   ```ts
   const bowlerUpsertUrl = new URL(`${SUPABASE_REST_URL}/bowlers`);
   bowlerUpsertUrl.searchParams.set('on_conflict', 'id');
   // POST [enrichedBowlers] with Prefer: resolution=merge-duplicates
   ```

6. Delete removed bowlers:

   ```ts
   const bowlerDeleteUrl = new URL(`${SUPABASE_REST_URL}/bowlers`);
   bowlerDeleteUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
   bowlerDeleteUrl.searchParams.set('id', `in.("id1","id2",...)`);
   // DELETE
   ```

So the bowler table is always kept in sync with the local in-memory list for that user.

The *entry points* that call this:

- Main save button in the layout: [Layout.handleSaveData](file:///c:/functions/Trae/a3-bowler-supabase/src/components/Layout.tsx#L2017-L2033).
- Account settings when you change dashboard/email settings: [AccountSettingsModal.persistDashboardSettingsToBackend](file:///c:/functions/Trae/a3-bowler-supabase/src/components/AccountSettingsModal.tsx#L544-L558) reuses the same `saveData`, passing current bowlers and A3 cases.

**Reading bowlers**

For the logged-in user:

- [dataService.loadData](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts#L235-L354) fetches bowlers with:

  ```ts
  const bowlersUrl = new URL(`${SUPABASE_REST_URL}/bowlers`);
  bowlersUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
  bowlersUrl.searchParams.set('select', '*');
  bowlersUrl.searchParams.set('order', 'order_index.asc');
  ```

  Then it maps DB rows back to `Bowler` objects (camelCase fields).

- `AppProvider.loadUserData` in [AppContext](file:///c:/functions/Trae/a3-bowler-supabase/src/context/AppContext.tsx#L113-L214) calls `dataService.loadData(username)` and puts the result into context (`bowlers`, `a3Cases`, dashboard state).

For cross-user **consolidation**:

- [dataService.consolidateBowlers](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts#L568-L707):
  - Loads *all* bowlers (no user filter): `GET /bowlers?select=*`
  - Filters rows by `tag` matching requested tags.
  - Sorts them by `user_id`, then `order_index`.
  - Returns them to the UI.
- Called from [ConsolidateModal](file:///c:/functions/Trae/a3-bowler-supabase/src/components/ConsolidateModal.tsx#L74-L120), which merges them into the current user’s list.

The worker has a server-side version of this at `/consolidate` that also respects whether a user is public or not (see [worker/index.ts](file:///c:/functions/Trae/a3-bowler-supabase/worker/index.ts#L115-L307)); the frontend version uses only tags and RLS rules on Supabase.

---

**3. A3 Cases (table: `a3_cases`)**

Frontend `A3Case` type is defined in [types.ts](file:///c:/functions/Trae/a3-bowler-supabase/src/types.ts#L104-L130):

- Core fields:
  - `id`, `title`, `description?`, `owner?`, `group?`, `tag?`
  - `linkedMetricIds?`, `priority?`, `startDate?`, `endDate?`, `status?`
- Problem solving content:
  - `problemStatement?`, `problemContext?`, `results?`
  - `mindMapNodes?`, `mindMapText?`, `mindMapScale?`, `mindMapCanvasHeight?`
  - `rootCause?`, `actionPlanTasks?`
- Data-analysis & result canvas:
  - `dataAnalysisObservations?`
  - `dataAnalysisImages?: DataAnalysisImage[]`
  - `dataAnalysisCanvasHeight?: number`
  - `resultImages?: DataAnalysisImage[]`
  - `resultCanvasHeight?: number`

**Writing A3 cases**

In [dataService.saveData](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts#L79-L106), each `A3Case` is mapped to a Supabase row:

- `id`, `user_id`, `title`
- `description`, `owner`, `group`, `tag`
- `linked_metric_ids`, `priority`, `start_date`, `end_date`, `status`
- `problem_statement`, `problem_context`, `results`
- `mind_map_nodes`, `mind_map_text`, `mind_map_scale`, `mind_map_canvas_height`
- `root_cause`, `action_plan_tasks`
- `data_analysis_observations`
- `data_analysis_images` (JSON array of `DataAnalysisImage`)
- `data_analysis_canvas_height`
- `result_images` (JSON array)
- `result_canvas_height`

Then:

1. Load existing A3 IDs for this user:

   ```ts
   const a3IdsUrl = new URL(`${SUPABASE_REST_URL}/a3_cases`);
   a3IdsUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
   a3IdsUrl.searchParams.set('select', 'id');
   ```

2. Compute which to delete.
3. Upsert all current cases:

   ```ts
   const a3UpsertUrl = new URL(`${SUPABASE_REST_URL}/a3_cases`);
   a3UpsertUrl.searchParams.set('on_conflict', 'id');
   // POST [enrichedA3Cases] with Prefer: resolution=merge-duplicates
   ```

4. Delete removed ones with `DELETE /a3_cases?user_id=eq.<user>&id=in.(...)`.

**Reading A3 cases**

For the user:

- `dataService.loadData` fetches:

  ```ts
  const a3Url = new URL(`${SUPABASE_REST_URL}/a3_cases`);
  a3Url.searchParams.set('user_id', `eq.${trimmedUserId}`);
  a3Url.searchParams.set('select', '*');
  ```

- It remaps DB rows into `A3Case` structures (see [loadData mapping](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts#L298-L324)).

For **global A3 views (all users)**:

- [dataService.loadAllA3Cases](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts#L356-L466):
  - Calls `GET /a3_cases?select=*` with the publishable key.
  - Builds a `profileCache` of user visibility and plant via `authService.getUser(userKey)`.
  - Filters out non-public users.
  - Maps fields back to A3Case-like objects plus `userId`, `userAccountId`, `plant`.
  - Sorts by user, then start date.

The worker has an equivalent endpoint `/all-a3` that does the same but server-side, using a separate login service ([worker/index.ts](file:///c:/functions/Trae/a3-bowler-supabase/worker/index.ts#L319-L441)).

**Lazy “detail” loading for heavy fields**

To avoid loading large image arrays on every initial load, the app has a narrower “detail” endpoint just for the heavy bits.

Frontend version: [dataService.loadA3Detail](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts#L468-L512)

- Calls:

  ```ts
  const url = new URL(`${SUPABASE_REST_URL}/a3_cases`);
  url.searchParams.set('user_id', `eq.${trimmedUserId}`);
  url.searchParams.set('id', `eq.${a3Id}`);
  url.searchParams.set('select', 'data_analysis_images,data_analysis_canvas_height,result_images,result_canvas_height');
  ```

- Returns just those four fields.

Usage:

- [DataAnalysis.tsx](file:///c:/functions/Trae/a3-bowler-supabase/src/pages/a3-subpages/DataAnalysis.tsx#L67-L118) and [Result.tsx](file:///c:/functions/Trae/a3-bowler-supabase/src/pages/a3-subpages/Result.tsx#L56-L106) both:
  - On mount (or case switch), if the current case doesn’t already have images loaded, they call `dataService.loadA3Detail(user.username, currentCase.id)`.
  - Merge `dataAnalysisImages`, `dataAnalysisCanvasHeight`, `resultImages`, `resultCanvasHeight` into the `A3Case` in context via `updateA3Case`.

Worker version: `/a3-detail` in [worker/index.ts](file:///c:/functions/Trae/a3-bowler-supabase/worker/index.ts#L46-L112) does the same via the service key (for external consumers).

**Consolidating A3 cases by tag**

- [dataService.consolidateBowlers](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts#L568-L707) loads all `a3_cases`, filters by `tag`, and returns `a3Cases` with mostly the same mapping as `loadData` (plus `userId`, `userAccountId` for sorting).
- Worker `/consolidate` does a similar thing but with public-profile checks.

---

**4. Dashboard & Mindmaps (table: `dashboards`)**

Dashboard state is per-user and lives in the `dashboards` table:

Writing happens in [dataService.saveData](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts#L44-L52,L108-L122):

- Row shape:

  ```ts
  const dashboardRow = {
    user_id: trimmedUserId,
    markdown: dashboardMarkdown ?? '',
    title: dashboardTitle ?? '',
    mindmaps: dashboardMindmaps ?? [],
    active_mindmap_id: activeMindmapId ?? null,
    settings: normalizedDashboardSettings,
  };
  ```

- POST with `on_conflict=user_id` and `Prefer: resolution=merge-duplicates` to upsert.
- Called both on manual save and when persisting dashboard/email settings from [AccountSettingsModal](file:///c:/functions/Trae/a3-bowler-supabase/src/components/AccountSettingsModal.tsx#L544-L558).

Reading dashboard data:

- In [dataService.loadData](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts#L250-L349) it fetches:

  ```ts
  const dashboardUrl = new URL(`${SUPABASE_REST_URL}/dashboards`);
  dashboardUrl.searchParams.set('user_id', `eq.${trimmedUserId}`);
  dashboardUrl.searchParams.set('select', '*');
  ```

- Then extracts:

  - `dashboardMarkdown`, `dashboardTitle`
  - `dashboardMindmaps` (array)
  - `activeMindmapId` (string or null)
  - `dashboardSettings` (object with AI model, email schedule, etc.)

- [AppContext.loadUserData](file:///c:/functions/Trae/a3-bowler-supabase/src/context/AppContext.tsx#L193-L258) uses that to:
  - Set mindmaps and choose an active one.
  - Set `dashboardMarkdown`/`dashboardTitle`.
  - Persist everything into IndexedDB for offline/fast reload.

Worker `/load` endpoint mirrors this full load for external consumers: [worker/index.ts](file:///c:/functions/Trae/a3-bowler-supabase/worker/index.ts#L450-L580).

---

**5. Pictures (Supabase Storage bucket: `a3-bowler`)**

There are two parts:

1. Actual binary image blobs in **Supabase Storage**.
2. Position/size/URL metadata in `a3_cases.data_analysis_images` and `a3_cases.result_images` columns.

**Data model for images (in app memory / DB)**

`DataAnalysisImage` type in [types.ts](file:///c:/functions/Trae/a3-bowler-supabase/src/types.ts#L86-L93):

- `id` – local UUID for the canvas item
- `src` – URL (either data URL or Supabase Storage public URL)
- `x`, `y` – canvas coordinates
- `width`, `height` – size on the canvas

These arrays are stored directly into the A3 table columns `data_analysis_images` and `result_images` as JSON.

**Uploading images to the bucket**

Core function: [dataService.uploadA3Image](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts#L515-L566):

- Generates a unique `imageId` (`crypto.randomUUID()` when available, fallback otherwise).
- Determines file extension from `file.type`:

  - `image/png` → `png`
  - `image/jpeg` → `jpg`
  - `image/gif` → `gif`
  - `image/webp` → `webp`
  - otherwise take the subtype after `/`.

- Builds an object path inside the bucket:

  ```ts
  const objectPath = `${A3_IMAGES_FOLDER}/${encodeURIComponent(trimmedUserId)}/${encodeURIComponent(a3Id)}/${imageId}.${extension}`;
  // A3_IMAGES_FOLDER = 'images'
  // A3_IMAGES_BUCKET = 'a3-bowler'
  ```

- Upload URL:

  ```ts
  const uploadUrl = `${SUPABASE_STORAGE_URL}/object/${encodeURIComponent(A3_IMAGES_BUCKET)}/${objectPath}`;
  // POST file with Content-Type = mimeType
  ```

- On success, it returns a **public URL**:

  ```ts
  const publicUrl = `${SUPABASE_STORAGE_URL}/object/public/${encodeURIComponent(A3_IMAGES_BUCKET)}/${objectPath}`;
  return { imageId, key: objectPath, url: publicUrl };
  ```

So the binary lives in Supabase Storage at:

- `bucket`: `a3-bowler`
- `path`: `images/<encoded_user_id>/<encoded_a3_id>/<imageId>.<ext>`

and the frontend only cares about `url`.

**How the UI uses this**

The canvas component: [ImageCanvas](file:///c:/functions/Trae/a3-bowler-supabase/src/components/ImageCanvas.tsx)

- It receives:
  - `images: DataAnalysisImage[]`
  - `onImagesChange(images)`
  - `height` and `onHeightChange`
  - optional `onUploadImage(file: Blob): Promise<string>` – if provided, it uses that to get a `src` string; otherwise it uses a local data URL.

On paste or file upload:

- If `onUploadImage` is provided (A3 pages do this):
  - It calls `const src = await onUploadImage(file);`
  - Creates a `DataAnalysisImage`:

    ```ts
    const newImage = {
      id: generateShortId(),
      src,
      x: 50, y: 50,
      width: 200, height: 200,
    };
    ```

  - Appends it to `images` and calls `onImagesChange(updated)`.

In the A3 pages:

- [DataAnalysis.tsx uploadImage](file:///c:/functions/Trae/a3-bowler-supabase/src/pages/a3-subpages/DataAnalysis.tsx#L27-L42)
- [Result.tsx uploadImage](file:///c:/functions/Trae/a3-bowler-supabase/src/pages/a3-subpages/Result.tsx#L20-L35)

Each calls:

```ts
const result = await dataService.uploadA3Image(user.username, currentCase.id, file);
return result.url;
```

Then, the page’s `saveImages` handler:

- Updates local state (`setImages`).
- Updates the A3 case in context via `updateA3Case`:

  - DataAnalysis: sets `dataAnalysisImages`.
  - Result: sets `resultImages`.

When you click **Save Data**, `dataService.saveData` persists those arrays to Supabase as JSON.

There is **no cleanup** of orphaned storage objects if you delete an image from the canvas; the DB reference is removed, but the underlying storage object is not deleted anywhere in this codebase.

**Reading images from the bucket**

The app never directly downloads binary images from the storage API on the server side. Instead:

- Supabase returns the **JSON arrays** stored in the `a3_cases` table (`data_analysis_images` / `result_images`) via `loadData` or `loadA3Detail`.
- Those are mapped into `DataAnalysisImage[]` with `src` fields pointing to storage public URLs.
- The browser then simply renders `<img src={image.src} />` (inside `ImageCanvas`), and the actual HTTP GET is done directly against Supabase Storage’s public endpoint.

So the “read path” for pictures is:

1. DB: `SELECT data_analysis_images/result_images FROM a3_cases`
2. App: `DataAnalysisImage.src` = full public URL
3. Browser: GET that URL directly.

---

**6. Workers vs Frontend**

You effectively have three “tiers” using Supabase:

- **Frontend app** (browser):
  - Uses `VITE_SUPABASE_PUBLISHABLE_KEY` via [dataService](file:///c:/functions/Trae/a3-bowler-supabase/src/services/dataService.ts).
  - Responsible for:
    - Saving/loading user’s bowlers & A3 cases (`saveData` / `loadData`).
    - Global A3 catalog (`loadAllA3Cases`).
    - Consolidation by tags (`consolidateBowlers`).
    - Uploading images to storage (`uploadA3Image`).

- **Cloudflare worker `worker/`**:
  - Uses `SUPABASE_SERVICE_KEY` and `SUPABASE_URL`.
  - Provides REST-like endpoints:
    - `/load` – same as `loadData` for a given `userId`.
    - `/a3-detail` – same as `loadA3Detail`.
    - `/consolidate` – load & filter bowlers/A3 by tags, plus public-profile filtering via `https://login.study-llm.me/user/...`.
    - `/all-a3` – global A3 list with visibility and plant info.
  - All calls use `getSupabaseRestUrl(env)` and `getSupabaseHeaders(env)` in [worker/index.ts](file:///c:/functions/Trae/a3-bowler-supabase/worker/index.ts#L6-L29).

- **Email worker `email-worker/`**:
  - Also uses `SUPABASE_SERVICE_KEY` to read/write to a `scheduled_emails` table.
  - Not directly about bowlers/A3/images, but related to summaries built from that data.

---

If you’d like, I can sketch a small “ERD-style” summary of the Supabase tables (`bowlers`, `a3_cases`, `dashboards`, `scheduled_emails`, storage path conventions) so you can align DB schema changes with the current code expectations.