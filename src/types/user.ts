export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: UserRole;
  bio?: string;
  title?: string;
  createdAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: UserRole;
}
