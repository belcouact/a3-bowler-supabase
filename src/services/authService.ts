export interface User {
  username: string;
  email?: string;
  role?: string;
  country?: string;
  plant?: string;
  team?: string;
  isPublicProfile?: boolean;
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

  async updateProfile(data: any) {
    const response = await fetch(`${API_BASE_URL}/update-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Update profile failed');
    }
    return response.json();
  },

  async getUser(username: string) {
    // Note: We keep @ unencoded because the server might not decode the path parameter
    const encodedUsername = encodeURIComponent(username).replace(/%40/g, '@');
    const response = await fetch(`${API_BASE_URL}/user/${encodedUsername}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return response.json();
  },
};
