import axios from 'axios';
import type { UserSignup, UserLogin, UserProfile, Token } from '../types/users';

const API_BASE_URL = 'http://localhost:8000';

export class ApiService {
  private static instance: ApiService;

  constructor() {
    this.setupAxiosInterceptors();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupAxiosInterceptors() {
    // Request interceptor
    axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token && !config.url?.includes('/auth/') && !config.url?.includes('/public/')) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('401 Unauthorized, clearing token');
          localStorage.removeItem('access_token');
          window.location.href = '/auth/signin';
        }
        return Promise.reject(error);
      }
    );
  }

  async signup(userData: UserSignup) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, userData);
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async login(loginData: UserLogin): Promise<Token> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No token available');
      }

      const response = await axios.get(`${API_BASE_URL}/private/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }
}

export const apiService = ApiService.getInstance();