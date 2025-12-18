// This service will interact with the Cloudflare Worker to save/load data
// Since the worker URL is not yet deployed, we will use a placeholder or assume a local development URL
// You should update this URL when you deploy the worker.

const API_BASE_URL = 'https://bowler-worker.study-llm.me';

export const dataService = {
  async saveData(bowlers: any[], a3Cases: any[], userId: string, dashboardMarkdown?: string) {
    const payload = {
      bowlers,
      a3Cases,
      userId,
      dashboardMarkdown
    };

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
        // If 404, it might mean the worker route isn't found OR no data for user (depending on worker logic).
        // To prevent "crashing" or blocking the UI, we return empty data.
        if (response.status === 404) {
             console.warn(`Data load endpoint returned 404 for user ${userId}. Returning empty data.`);
             return { success: true, bowlers: [], a3Cases: [] };
        }
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
        console.error("Error in loadData:", error);
        // Return empty structure to prevent app crash
        return { success: false, bowlers: [], a3Cases: [] };
    }
  },
};
