export interface JwtPayload {
  access_token: string;
  email: string;
  userId: number;
  userType: 'coach' | 'client';
  isVerified: boolean;
  role: 'coach' | 'client';
  exp: number;
}
