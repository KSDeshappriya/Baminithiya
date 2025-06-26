import type { UserRole, UserSignup, UserLogin,Token, TokenPayload } from '../types/users';
import { apiService } from './api';

class AuthService {
  private token: string | null = null;
  private tokenPayload: TokenPayload | null = null;
  private readonly tokenKey = 'access_token';

  constructor() {
    this.token = localStorage.getItem(this.tokenKey);
    if (this.token) {
      this.loadTokenPayload();
    }
  }

  private loadTokenPayload() {
    if (this.token) {
      this.tokenPayload = apiService.parseJwt(this.token);
      if (this.token && apiService.isTokenExpired(this.token)) {
        console.log('Token expired, logging out');
        this.logout();
      }
    }
  }

  // Token management methods
  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.token = token;
    this.loadTokenPayload();
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.token = null;
    this.tokenPayload = null;
  }

  getTokenPayload(): TokenPayload | null {
    return this.tokenPayload;
  }

  // Authentication methods
  async signup(userData: UserSignup) {
    try {
      const response = await apiService.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async login(loginData: UserLogin): Promise<Token> {
    try {
      const response = await apiService.post<Token>('/auth/login', loginData);
      const token = response.data;
      
      // Store token
      this.setToken(token.access_token);
      
      return token;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout() {
    this.removeToken();
  }

  // Authentication state methods
  isAuthenticated(): boolean {
    const hasToken = !!this.token;
    const hasValidPayload = !!this.tokenPayload;
    const isNotExpired = this.token ? !apiService.isTokenExpired(this.token) : false;
    
    const isAuth = hasToken && hasValidPayload && isNotExpired;
    
    if (!isAuth && hasToken) {
      // Clean up invalid token
      this.logout();
    }
    
    return isAuth;
  }

  // Role-based methods
  getUserRole(): UserRole | null {
    return this.tokenPayload?.role || null;
  }

  hasRole(role: UserRole): boolean {
    return this.getUserRole() === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  getUserId(): string | null {
    return this.tokenPayload?.uid || null;
  }

  getUserName(): string | null {
    return this.tokenPayload?.name || null;
  }

  getUserEmail(): string | null {
    return this.tokenPayload?.email || null;
  }
}

export const authService = new AuthService();