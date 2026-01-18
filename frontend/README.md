# Lost + Found Mobile App

A React Native mobile application built with Expo for iOS and Android that helps users reunite with lost items across Vancouver.

## 🚀 Tech Stack

- **Framework**: Expo (React Native + TypeScript)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Query (TanStack Query)
- **API Client**: Axios
- **Forms**: react-hook-form + zod
- **Secure Storage**: expo-secure-store (JWT tokens)
- **Image Picking**: expo-image-picker
- **UI**: Custom components with Light/Dark theme support

## 📁 Project Structure

```
├── app/                      # Expo Router file-based routes
│   ├── (auth)/              # Auth flow screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── lost.tsx
│   │   ├── find.tsx
│   │   ├── found.tsx
│   │   └── settings.tsx
│   └── _layout.tsx          # Root layout with providers
├── src/
│   ├── api/                 # API client and endpoints
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   └── maps/            # Location picker (Cartes.io placeholder)
│   ├── hooks/               # React Query hooks
│   ├── screens/             # Screen components
│   ├── theme/               # Theme system
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
└── .env                     # Environment variables

```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure your backend URL:

```bash
# For iOS Simulator / Web
EXPO_PUBLIC_API_URL=http://localhost:8000

# For Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000

# For Physical Device (use your computer's IP)
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8000
```

### 3. Run the App

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## ✅ Implemented Features

### Authentication
- ✅ Sign In screen with email/password validation
- ✅ Sign Up screen with form validation
- ✅ JWT token storage in secure storage
- ✅ Automatic auth state management
- ✅ Protected routes

### API Integration
- ✅ Axios client with JWT interceptors
- ✅ Auth API (login, register, logout)
- ✅ Items API (CRUD operations)
- ✅ Matches API (create, confirm, reject, preferences)
- ✅ Notifications API

### UI System
- ✅ Light/Dark theme support
- ✅ Reusable component library (Button, Input, Card, LiquidPill)
- ✅ Modern minimal black & white design
- ✅ Liquid pill effect for category tags

### Navigation
- ✅ Expo Router file-based navigation
- ✅ Bottom tabs (Lost, Find, Found, Settings)
- ✅ Auth flow
- ✅ Tab navigation setup

### Lost Tab
- ✅ Categorized item list (Unfound/Found/Returned)
- ✅ Item cards with images
- ✅ Pull-to-refresh
- ✅ Add button navigation

## 🚧 To Be Implemented

The following screens and features need to be implemented following the patterns established:

### 1. Lost Item Detail Screen
**File**: `app/lost/[id].tsx`
- Show full item details
- Delete button for unfound items
- "Schedule meet" button for found items
- Display all 4 attributes (location, time, name, description, picture)

### 2. Add Lost Item Flow
**Files**: `app/lost/add/*`
- `location.tsx` - Location picker (use LocationPicker component)
- `when.tsx` - DateTime picker
- `name.tsx` - Name & description inputs
- `picture.tsx` - Image picker (optional)
- `review.tsx` - Review all inputs
- `posted.tsx` - Success confirmation

### 3. Find Tab
**File**: `app/(tabs)/find.tsx`
- Item selector dropdown (choose unfound item)
- Vertical swipeable feed (TikTok-style)
- Match cards with claim button
- Use `usePotentialMatches` hook
- Claim confirmation flow

### 4. Found Tab
**File**: `app/(tabs)/found.tsx`
- Similar structure to LostScreen
- Categories: Found/Matched/Returned
- Add button for new found items
- Navigate to scheduling for matched items

### 5. Add Found Item Flow
**Files**: `app/found/add/*`
- Same flow as lost items
- **Picture is REQUIRED**

### 6. Scheduling/Return Method Flow
**Files**: `app/scheduling/*`
- `preference.tsx` - 3 button choices
- `waiting.tsx` - Waiting for other user
- `in-person.tsx` - Contact info display
- `lost-and-found.tsx` - Location selector + notify button
- Decision resolution logic (see requirements)

### 7. Settings Tab
**File**: `app/(tabs)/settings.tsx`
- Account section (profile, auth, delete account)
- Privacy toggles
- Notification preferences
- App preferences (theme toggle, compact view)
- Help & Safety section

### Implementation Tips

1. **Follow Existing Patterns**:
   - Use `useAppTheme()` for theming
   - Use React Query hooks for API calls
   - Follow the Card + LiquidPill pattern for lists
   - Use `router.push()` for navigation

2. **Cartes.io Integration**:
   - All map integration points are in `LocationPicker.tsx`
   - Search for `TODO: CARTES.IO` comments
   - The component interface is ready, just swap the placeholder

3. **Styling**:
   - Always use `theme.colors`, `theme.spacing`, `theme.borderRadius`
   - Use `theme.shadows` for elevation
   - Support both light and dark modes

4. **Forms**:
   - Use `react-hook-form` with `zod` validation
   - Follow SignInScreen pattern

5. **Data Flow**:
   - React Query automatically refetches after mutations
   - Use `refetch()` for manual refreshes
   - Check `src/hooks/*` for available hooks

## 🔌 Backend Integration

The app expects these endpoints:

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user

### Items
- `GET /api/items` - Get user's items (query: `?type=lost|found`)
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Matches
- `GET /api/matches` - Get matches
- `GET /api/matches/potential/:lostItemId` - Get potential matches for Find tab
- `POST /api/matches` - Create match
- `POST /api/matches/:id/confirm` - Confirm match
- `POST /api/matches/:id/reject` - Reject match
- `PUT /api/matches/:id/preference` - Update return preference
- `POST /api/matches/:id/notify` - Notify item returned

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

## 🎨 Design System

### Colors
- **Light Mode**: White background, black text
- **Dark Mode**: Black background, white text
- **Category Colors**:
  - Red: Unfound
  - Orange: Found/Matched
  - Green: Returned

### Components
- **LiquidPill**: Category tags with gradient blob effect
- **Button**: Primary, secondary, outline, danger variants
- **Input**: With label, error states, password toggle
- **Card**: Default and elevated variants

## 📝 Next Steps

1. **Implement remaining screens** following the patterns in `LostScreen.tsx` and `SignInScreen.tsx`
2. **Add Cartes.io integration** in `LocationPicker.tsx`
3. **Test the full flow** end-to-end
4. **Add error handling** and loading states
5. **Implement notifications** system
6. **Add image upload** functionality
7. **Polish UI animations** and transitions

## 🐛 Troubleshooting

### Android Emulator Can't Connect to Backend
- Use `10.0.2.2` instead of `localhost` in `.env`
- Make sure backend is running on your host machine

### JWT Token Issues
- Tokens are stored in `expo-secure-store`
- Check `src/api/client.ts` for token management
- Clear app data to reset auth state

### Theme Not Persisting
- Preferences stored in AsyncStorage
- Check `app/_layout.tsx` for persistence logic

## 📄 License

This project is for the Lost & Found Vancouver application.
