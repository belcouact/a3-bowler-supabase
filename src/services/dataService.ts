const API_BASE_URL = 'https://bowler-worker.study-llm.me';
const EMAIL_API_BASE_URL = 'https://email-worker.study-llm.me';

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
    const payload: any = {
      bowlers,
      a3Cases,
      userId,
      dashboardMarkdown,
      dashboardTitle
    };

    if (dashboardMindmaps !== undefined) {
      payload.dashboardMindmaps = dashboardMindmaps;
    }
    if (activeMindmapId !== undefined && activeMindmapId !== null) {
      payload.activeMindmapId = activeMindmapId;
    }

    if (dashboardSettings !== undefined) {
      payload.dashboardSettings = dashboardSettings;
    }

    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to save data');
    }

    return response.json();
  },

  async loadData(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/load?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Data load endpoint returned 404 for user ${userId}. Returning empty data.`);
          return { success: true, bowlers: [], a3Cases: [] };
        }
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error in loadData:', error);
      return { success: false, bowlers: [], a3Cases: [] };
    }
  },

  async loadAllA3Cases() {
    const response = await fetch(`${API_BASE_URL}/all-a3`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load global A3 cases');
    }

    return response.json();
  },

  async loadA3Detail(userId: string, a3Id: string) {
    const url = new URL(`${API_BASE_URL}/a3-detail`);
    url.searchParams.set('userId', userId);
    url.searchParams.set('a3Id', a3Id);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load A3 detail');
    }

    return response.json();
  },

  async uploadA3Image(userId: string, a3Id: string, file: Blob) {
    const imageId =
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const url = new URL(`${API_BASE_URL}/a3-image`);
    url.searchParams.set('userId', userId);
    url.searchParams.set('a3Id', a3Id);
    url.searchParams.set('imageId', imageId);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': (file as any).type || 'image/webp',
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error('Failed to upload A3 image');
    }

    const result = await response.json();

    return {
      imageId: result.imageId || imageId,
      key: result.key as string | undefined,
      url:
        result.url ||
        `${API_BASE_URL}/a3-image?userId=${encodeURIComponent(
          userId,
        )}&a3Id=${encodeURIComponent(a3Id)}&imageId=${encodeURIComponent(
          imageId,
        )}`,
    };
  },

  async consolidateBowlers(tags: string[]) {
    const response = await fetch(`${API_BASE_URL}/consolidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tags }),
    });

    if (!response.ok) {
      throw new Error('Failed to consolidate bowlers');
    }

    return response.json();
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
