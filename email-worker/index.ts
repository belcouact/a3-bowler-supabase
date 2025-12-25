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
  sendAt: number;
  sent: boolean;
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
      from: 'A3 Bowler <no-reply@example.com>',
      to: job.recipients,
      subject: job.subject,
      text: job.body,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend error: ${response.status} ${response.statusText}`);
  }
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
            body: string;
            sendAt: string;
          };

          const { userId, recipients, subject, body, sendAt } = data;

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
            body,
            sendAt: sendAtMs,
            sent: false,
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
              await sendEmailWithResend(env, job);
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
