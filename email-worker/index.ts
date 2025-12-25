export interface Env {
  EMAIL_JOBS: KVNamespace;
  RESEND_API_KEY: string;
}

interface ScheduledEmailJob {
  id: string;
  userId: string | null;
  recipients: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  sendAt: number;
  sent: boolean;
  mode?: 'manual' | 'autoSummary';
  aiModel?: string;
}

const createId = (prefix: string, index?: number) => {
  const anyGlobal = globalThis as any;
  if (anyGlobal.crypto && typeof anyGlobal.crypto.randomUUID === 'function') {
    return anyGlobal.crypto.randomUUID();
  }
  const suffix = index != null ? `${Date.now()}-${index}` : `${Date.now()}-${Math.random()}`;
  return `${prefix}-${suffix}`;
};

const sendEmailWithResend = async (env: Env, job: ScheduledEmailJob) => {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'A3 Bowler <no-reply@study-llm.me>',
      to: job.recipients,
      subject: job.subject,
      text: job.body,
      html: job.bodyHtml,
    }),
  });

  if (!response.ok) {
    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch {
      bodyText = '';
    }
    throw new Error(`Resend error: ${response.status} ${response.statusText} ${bodyText}`);
  }
};

const getValidModel = (model?: string | null): string => {
  if (model === 'gemini' || model === 'deepseek' || model === 'kimi' || model === 'glm') {
    return model;
  }
  return 'deepseek';
};

const buildSimpleHtmlFromText = (text: string): string => {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const withBreaks = escaped
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '<br />');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Monthly A3 / metric summary</title>
</head>
<body>
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6;">
    ${withBreaks}
  </div>
</body>
</html>`;
};

const generateComprehensiveSummary = async (
  context: string,
  prompt: string,
  model: string,
): Promise<string> => {
  try {
    const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for the Metric Bowler & A3 Problem Solving application. 
            Here is the current data in the application: ${context}.
            Answer the user's questions based on this data. Be concise and helpful.`,
          },
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.delta?.content ||
      "Sorry, I couldn't generate a response."
    );
  } catch (error) {
    console.error('AI Summary Error:', error);
    return 'Sorry, there was an error generating the summary. Please try again later.';
  }
};

const buildAutoSummaryForJob = async (job: ScheduledEmailJob): Promise<ScheduledEmailJob> => {
  if (!job.userId) {
    throw new Error('userId is required for auto summary emails');
  }

  const userId = job.userId;
  const response = await fetch(
    `https://bowler-worker.study-llm.me/load?userId=${encodeURIComponent(userId)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load user data for summary: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as any;
  const bowlers = Array.isArray(data.bowlers) ? data.bowlers : [];
  const a3Cases = Array.isArray(data.a3Cases) ? data.a3Cases : [];
  const dashboardSettings = data.dashboardSettings || {};

  const context = JSON.stringify({
    bowlers: bowlers.map((b: any) => ({
      ...b,
      group: b.group || 'Ungrouped',
    })),
    a3Cases: a3Cases.map((c: any) => {
      const clone = { ...c };
      delete (clone as any).mindMapNodes;
      delete (clone as any).dataAnalysisImages;
      delete (clone as any).resultImages;
      delete (clone as any).dataAnalysisCanvasHeight;
      delete (clone as any).resultCanvasHeight;
      return clone;
    }),
  });

  const prompt = `You are generating a monthly A3 / metric summary email for the Metric Bowler & A3 Problem Solving application.

Use the provided context of bowler metrics and A3 cases.

Goals:
1) Provide an executive overview of overall metric performance.
2) Highlight key metrics or groups that are off-track or at risk.
3) Summarize the status and coverage of A3 problem-solving work.
4) Suggest 3–5 specific focus areas for the upcoming month.

Write the response as a clear, concise email body suitable for busy leaders. Do not use markdown or code fences.`;

  const aiModelFromSettings =
    typeof dashboardSettings.aiModel === 'string' ? dashboardSettings.aiModel : null;
  const model = getValidModel(aiModelFromSettings || job.aiModel || null);

  const summary = await generateComprehensiveSummary(context, prompt, model);
  const html = buildSimpleHtmlFromText(summary);

  return {
    ...job,
    body: summary,
    bodyHtml: html,
  };
};

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      const url = new URL(request.url);

      if (request.method === 'POST' && url.pathname === '/schedule-email') {
        try {
          const data = (await request.json()) as {
            userId?: string;
            recipients: string[];
            subject: string;
            body?: string;
            bodyHtml?: string;
            sendAt: string;
            mode?: 'manual' | 'autoSummary';
            aiModel?: string;
          };

          const { userId, recipients, subject, body, bodyHtml, sendAt, mode, aiModel } = data;

          if (!Array.isArray(recipients) || recipients.length === 0) {
            return new Response(
              JSON.stringify({ success: false, error: 'At least one recipient is required' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              },
            );
          }

          if (!subject) {
            return new Response(
              JSON.stringify({ success: false, error: 'Subject is required' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              },
            );
          }

          const jobMode: 'manual' | 'autoSummary' = mode === 'autoSummary' ? 'autoSummary' : 'manual';

          if (jobMode === 'autoSummary') {
            if (!userId) {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: 'userId is required for auto summary emails',
                }),
                {
                  status: 400,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                },
              );
            }
          } else if (!body) {
            return new Response(
              JSON.stringify({ success: false, error: 'Subject and body are required' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              },
            );
          }

          const sendAtMs = Date.parse(sendAt);
          if (Number.isNaN(sendAtMs)) {
            return new Response(
              JSON.stringify({ success: false, error: 'sendAt must be a valid date/time string' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              },
            );
          }

          const id = createId('email');

          const job: ScheduledEmailJob = {
            id,
            userId: userId || null,
            recipients,
            subject,
            body: body || '',
            bodyHtml,
            sendAt: sendAtMs,
            sent: false,
            mode: jobMode,
            aiModel,
          };

          await env.EMAIL_JOBS.put(`email:${id}`, JSON.stringify(job));

          return new Response(JSON.stringify({ success: true, id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (request.method === 'POST' && url.pathname === '/send-email-now') {
        try {
          const data = (await request.json()) as {
            userId?: string;
            recipients: string[];
            subject: string;
            body: string;
            bodyHtml?: string;
          };

          const { userId, recipients, subject, body, bodyHtml } = data;

          if (!Array.isArray(recipients) || recipients.length === 0) {
            return new Response(
              JSON.stringify({ success: false, error: 'At least one recipient is required' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              },
            );
          }

          if (!subject || !body) {
            return new Response(
              JSON.stringify({ success: false, error: 'Subject and body are required' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              },
            );
          }

          const job: ScheduledEmailJob = {
            id: createId('email'),
            userId: userId || null,
            recipients,
            subject,
            body,
            bodyHtml,
            sendAt: Date.now(),
            sent: false,
          };

          await sendEmailWithResend(env, job);

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const now = Date.now();
    let cursor: string | undefined = undefined;
    let done = false;

    while (!done) {
      const list = await env.EMAIL_JOBS.list({ prefix: 'email:', cursor });
      cursor = list.cursor;
      done = list.list_complete;

      for (const key of list.keys) {
        const value = await env.EMAIL_JOBS.get(key.name);
        if (!value) {
          continue;
        }

        let job: ScheduledEmailJob;
        try {
          job = JSON.parse(value) as ScheduledEmailJob;
        } catch {
          continue;
        }

        if (job.sent) {
          continue;
        }
        if (job.sendAt > now) {
          continue;
        }

        ctx.waitUntil(
          (async () => {
            try {
              let jobToSend = job;
              if (job.mode === 'autoSummary') {
                jobToSend = await buildAutoSummaryForJob(job);
              }
              await sendEmailWithResend(env, jobToSend);
              job.sent = true;
              await env.EMAIL_JOBS.put(key.name, JSON.stringify(job));
            } catch (err) {
              console.error('Failed to send scheduled email', err);
            }
          })(),
        );
      }
    }
  },
};
