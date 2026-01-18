// Types matching backend models

export interface User {
  id: string | number;
  email: string;
  name: string;
  phone?: string;
  university?: string;
  createdAt: string;
}

export interface Item {
  id: string;
  userId: string;
  type: 'lost' | 'found';
  status: 'unfound' | 'found' | 'matched' | 'returned';
  name: string;
  title?: string;
  description: string;
  category: string;
  location: string | { latitude: number; longitude: number };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  imageUrl?: string;
  imageUrls?: string[];
  attributes?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Match {
  id: string;
  lostItemId: string;
  foundItemId: string;
  lostUserId: string;
  foundUserId: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'scheduling' | 'awaiting_pickup';
  score: number;
  lostUserPreference?: ReturnMethod;
  foundUserPreference?: ReturnMethod;
  resolvedReturnMethod?: ReturnMethod;
  returnLocation?: string;
  notifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  lostItem?: Item;
  foundItem?: Item;
  lostUser?: User;
  foundUser?: User;
}

export type ReturnMethod = 'local_lost_and_found' | 'in_person' | 'no_preference';

export interface Notification {
  id: string;
  userId: string;
  type: 'match_found' | 'match_confirmed' | 'item_returned' | 'message';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  compactView?: boolean;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  matchAlerts?: boolean;
  privacyContactInfo?: boolean;
}

export interface PotentialMatch {
  item: Item;
  score: number;
  distanceScore: number;
  timeScore: number;
  similarityScore: number;
}
