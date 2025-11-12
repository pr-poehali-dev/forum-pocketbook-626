const AUTH_API_URL = 'https://functions.poehali.dev/74e07575-7f1a-4af7-a4da-216ee71a71ac';

interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
}

interface AuthResponse {
  session_token: string;
  user: User;
}

export const authService = {
  async loginWithGoogle(accessToken: string): Promise<AuthResponse> {
    const response = await fetch(`${AUTH_API_URL}?action=google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Authentication failed');
    }

    const data = await response.json();
    
    if (data.session_token) {
      localStorage.setItem('session_token', data.session_token);
    }
    
    return data;
  },

  async getCurrentUser(): Promise<User | null> {
    const sessionToken = localStorage.getItem('session_token');
    
    if (!sessionToken) {
      return null;
    }

    try {
      const response = await fetch(`${AUTH_API_URL}?action=me`, {
        method: 'GET',
        headers: {
          'X-Session-Token': sessionToken,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('session_token');
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      localStorage.removeItem('session_token');
      return null;
    }
  },

  async logout(): Promise<void> {
    const sessionToken = localStorage.getItem('session_token');
    
    if (sessionToken) {
      try {
        await fetch(`${AUTH_API_URL}?action=logout`, {
          method: 'POST',
          headers: {
            'X-Session-Token': sessionToken,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('session_token');
  },

  getSessionToken(): string | null {
    return localStorage.getItem('session_token');
  }
};
