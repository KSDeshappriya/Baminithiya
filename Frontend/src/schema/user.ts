import { z } from "zod";

export const userSignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  profile_image_url: z.string().url().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['user', 'volunteer', 'first_responder', 'government']),
  skills: z.array(z.string()).optional(),
  department: z.string().optional(),
  unit: z.string().optional(),
  position: z.string().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short"),
  latitude: z.number(),
  longitude: z.number(),
});
