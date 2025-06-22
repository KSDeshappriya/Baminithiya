import type { UserRole, UserSignup, UserLogin, UserProfile, Token, TokenPayload } from '../types/users';
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

  private parseJwt(token: string): TokenPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  }

  private loadTokenPayload() {
    if (this.token) {
      this.tokenPayload = this.parseJwt(this.token);
      // Check if token is expired
      if (this.tokenPayload && this.tokenPayload.exp * 1000 < Date.now()) {
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
      return await apiService.signup(userData);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async login(loginData: UserLogin): Promise<Token> {
    try {
      const token = await apiService.login(loginData);
      
      // Store token using consistent method
      this.setToken(token.access_token);
      
      return token;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      return await apiService.getUserProfile();
    } catch (error) {
      console.error('Get profile error:', error);
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
    const isNotExpired = this.tokenPayload ? this.tokenPayload.exp * 1000 > Date.now() : false;
    
    const isAuth = hasToken && hasValidPayload && isNotExpired;
    
    if (!isAuth && hasToken) {
      this.logout();
    }
    
    return isAuth;
  }

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
}

export const authService = new AuthService();