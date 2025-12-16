// This service will interact with the Cloudflare Worker to save/load data
// Since the worker URL is not yet deployed, we will use a placeholder or assume a local development URL
// You should update this URL when you deploy the worker.

const API_BASE_URL = 'https://bowler-worker.study-llm.me';

export const dataService = {
  async saveData(bowlers: any[], a3Cases: any[], userId: string) {
    const payload = {
      bowlers,
      a3Cases,
      userId
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
    const response = await fetch(`${API_BASE_URL}/load?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load data');
    }

    return response.json();
  },
};
