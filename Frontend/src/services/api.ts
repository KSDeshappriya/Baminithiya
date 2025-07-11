/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { TokenPayload } from '../types/users';

const API_BASE_URL = 'http://localhost:8000';
const TOKEN_KEY = 'access_token';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000, // increased from 10000 to 60000ms (60 seconds)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        
        // Add Authorization header if token exists and it's not an auth/public endpoint
        if (token && !this.isPublicEndpoint(config.url || '')) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // Redirect to login page
          window.location.href = '/auth/signin';
        }
        return Promise.reject(error);
      }
    );
  }

  private isPublicEndpoint(url: string): boolean {
    const publicPaths = ['/auth/', '/public/'];
    return publicPaths.some(path => url.includes(path));
  }

  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  public parseJwt(token: string): TokenPayload | null {
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

  public isTokenExpired(token: string): boolean {
    const payload = this.parseJwt(token);
    if (!payload) return true;
    return payload.exp * 1000 < Date.now();
  }

  // Expose axios instance methods
  public get<T = any>(url: string, config?: any) {
    return this.axiosInstance.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: any) {
    return this.axiosInstance.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: any) {
    return this.axiosInstance.put<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: any) {
    return this.axiosInstance.delete<T>(url, config);
  }

  public patch<T = any>(url: string, data?: any, config?: any) {
    return this.axiosInstance.patch<T>(url, data, config);
  }
}

export const apiService = new ApiService();