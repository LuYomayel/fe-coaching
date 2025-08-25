// Servicio de autenticación SSR-safe
export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Obtener token de forma segura
  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.warn('Error accessing token from localStorage:', error);
      return null;
    }
  }

  // Establecer token
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('token', token);
      } catch (error) {
        console.warn('Error setting token in localStorage:', error);
      }
    }
  }

  // Remover token
  removeToken(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('token');
      } catch (error) {
        console.warn('Error removing token from localStorage:', error);
      }
    }
  }

  // Verificar si hay token válido
  hasValidToken(): boolean {
    const token = this.getToken();
    return token !== null && token.length > 0;
  }

  // Obtener headers de autenticación
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }
}

// Instancia singleton para uso directo
export const authService = AuthService.getInstance();
