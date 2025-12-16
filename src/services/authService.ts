export interface User {
  username: string;
  role?: string;
  team?: string;
  [key: string]: any;
}

const API_BASE_URL = 'https://login.study-llm.me';

export const authService = {
  async signup(data: any) {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Signup failed');
    }
    return response.json();
  },

  async login(data: any) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Prefer errorData.error as seen in test response: {"error":"Invalid credentials","success":false}
      throw new Error(errorData.error || errorData.message || 'Login failed');
    }
    return response.json();
  },

  async logout() {
    // Assuming logout might need a token or session handling, but based on description it's just a POST
    // If the API relies on cookies, we need credentials: 'include'
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
    });
    if (!response.ok) {
        // It's possible logout is just a client-side clearing if server is stateless JWT without blacklist, 
        // but the prompt says there is a POST /logout endpoint.
      throw new Error('Logout failed');
    }
    return response.json();
  },

  async changePassword(data: any) {
    const response = await fetch(`${API_BASE_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Change password failed');
    }
    return response.json();
  },

  async getUser(username: string) {
    const response = await fetch(`${API_BASE_URL}/user/${username}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return response.json();
  },
};
