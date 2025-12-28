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
