export type UserRole = 'first_responder' | 'volunteer' | 'user' | 'government';

export interface UserSignup {
  name: string;
  email: string;
  phone: string;
  profile_image_url?: string;
  password: string;
  role: UserRole;
  skills?: string[];
  department?: string;
  unit?: string;
  position?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  latitude: number;
  longitude: number;
  profile_image_url: string | null;
  role: 'user' | 'volunteer' | 'first_responder' | 'government';
  created_at: string;
  skills?: string[];
  department?: string;
  unit?: string;
  position?: string;
  status?: 'normal' | 'emergency';
}

export interface UserLogin {
  email: string;
  password: string;
  latitude: number;
  longitude: number;
}

export interface Token {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_info: unknown;
}

export interface TokenPayload {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  exp: number;
}