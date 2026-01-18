// Core data models for the Lost & Found app

export interface User {
  id: string;
  email: string;
  fullName: string;
  city: string;
  profilePhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemType = 'lost' | 'found';

export type LostItemStatus = 'unfound' | 'found' | 'returned';
export type FoundItemStatus = 'found' | 'matched' | 'returned';

export interface Item {
  id: string;
  type: ItemType;
  status: LostItemStatus | FoundItemStatus;
  name: string;
  description: string;
  location: string;
  locationCoords?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string; // ISO string
  imageUrl?: string; // Optional for lost items, required for found items
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type ReturnMethod = 'local_lost_and_found' | 'in_person' | 'no_preference';

export type MatchStatus = 'pending' | 'confirmed' | 'rejected' | 'completed';

export interface Match {
  id: string;
  lostItemId: string;
  foundItemId: string;
  lostUserId: string;
  foundUserId: string;
  status: MatchStatus;
  matchScore?: number; // AI confidence score from backend
  lostUserPreference?: ReturnMethod;
  foundUserPreference?: ReturnMethod;
  resolvedReturnMethod?: ReturnMethod;
  returnLocation?: string; // For local lost and found
  hasNotified?: boolean; // For finder notification after drop-off
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'match' | 'confirmation' | 'retrieval' | 'system';
  title: string;
  message: string;
  itemId?: string;
  matchId?: string;
  read: boolean;
  createdAt: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  city: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Settings types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  compactView: boolean;
  privacyContactInfoHidden: boolean;
  notificationsEnabled: boolean;
  notificationTypes: {
    matchAlerts: boolean;
    confirmationUpdates: boolean;
    retrievalUpdates: boolean;
  };
  emailNotifications: boolean;
}

// Extended Item types with populated data for UI
export interface ItemWithUser extends Item {
  user?: User;
}

export interface MatchWithItems extends Match {
  lostItem?: Item;
  foundItem?: Item;
  lostUser?: User;
  foundUser?: User;
}
