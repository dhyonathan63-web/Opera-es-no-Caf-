export type UserRole = 'admin' | 'operator';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
}

export interface Operation {
  id?: string;
  date: string;
  operatorId: string;
  operatorName: string;
  tractor: string;
  implement: string;
  task: string;
  crop: string;
  sector: string;
  initialMeter: number;
  finalMeter: number;
  totalHours: number;
  createdAt: string;
  synced: boolean;
}
