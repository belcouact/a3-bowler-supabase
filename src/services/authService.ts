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
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok || responseData.success === false) {
      throw new Error(responseData.error || responseData.message || 'Signup failed');
    }
    return responseData;
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
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok || responseData.success === false) {
      throw new Error(responseData.error || responseData.message || 'Logout failed');
    }
    return responseData;
  },

  async changePassword(data: any) {
    const response = await fetch(`${API_BASE_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok || responseData.success === false) {
      throw new Error(responseData.error || responseData.message || 'Change password failed');
    }
    return responseData;
  },

  async updateProfile(data: any) {
    const response = await fetch(`${API_BASE_URL}/update-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok || responseData.success === false) {
      throw new Error(responseData.error || responseData.message || 'Update profile failed');
    }
    return responseData;
  },

  async getUser(username: string) {
    // Note: We keep @ unencoded because the server might not decode the path parameter
    const encodedUsername = encodeURIComponent(username).replace(/%40/g, '@');
    const response = await fetch(`${API_BASE_URL}/user/${encodedUsername}`);
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok || responseData.success === false) {
      throw new Error(responseData.error || responseData.message || 'Failed to fetch user profile');
    }
    return responseData;
  },

  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const responseData = await response.json().catch(() => ({}));
    if (!response.ok || responseData.success === false) {
      throw new Error(responseData.error || responseData.message || 'Failed to fetch users');
    }
    return responseData;
  },
};
