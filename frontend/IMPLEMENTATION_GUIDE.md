# Lost + Found - Implementation Guide

This guide will help you complete the remaining screens and features.

## ✅ What's Already Built

### Core Infrastructure
- ✅ Expo + TypeScript project setup
- ✅ Expo Router file-based navigation
- ✅ React Query for API state management
- ✅ Axios client with JWT auth interceptors
- ✅ Secure token storage with expo-secure-store
- ✅ Light/Dark theme system with persistence
- ✅ Complete TypeScript types
- ✅ Reusable UI component library

### Completed Screens
- ✅ **Sign In** - Full validation, JWT storage, auto-navigation
- ✅ **Sign Up** - Form validation, checkbox for terms, navigation
- ✅ **Lost Tab** - Categorized list (Unfound/Found/Returned) with liquid pills
- ✅ **Settings** - Basic structure with Account, Preferences, Privacy, Help sections
- ✅ **Tab Navigation** - Icon-only bottom tabs

### Completed Features
- ✅ JWT authentication flow
- ✅ Protected routes
- ✅ Pull-to-refresh on Lost tab
- ✅ Theme toggle (Light/Dark/System)
- ✅ Logout functionality

## 🚧 What Needs To Be Built

### Priority 1: Essential Flows

#### 1. Lost Item Detail Screen
**Path**: `frontend/app/lost/[id].tsx`

Create a new file-based route for item details:

```typescript
import { useLocalSearchParams, router } from 'expo-router';
import { useItem } from '../../src/hooks/useItems';
import { useItems } from '../../src/hooks/useItems';

export default function LostItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item, isLoading } = useItem(id);
  const { deleteItem } = useItems();

  // Display:
  // - Image (if exists)
  // - Name
  // - Description
  // - Location
  // - Time (format timestamp nicely)
  // - Status badge (LiquidPill component)

  // Buttons based on status:
  if (item?.status === 'unfound') {
    // Show Delete button
    // On delete: call deleteItem(id), navigate back
  }

  if (item?.status === 'found') {
    // Show "Schedule meet" button
    // Navigate to scheduling flow
  }

  if (item?.status === 'returned') {
    // Show explanation text only
  }

  return (
    // Use Card, Button, LiquidPill components
    // Follow LostScreen.tsx styling patterns
  );
}
```

#### 2. Add Lost Item Flow
**Folder**: `frontend/app/lost/add/`

Create these screens in sequence:

**`location.tsx`** - Location selection
```typescript
import { router } from 'expo-router';
import { LocationPicker } from '../../../src/components/maps/LocationPicker';

export default function LocationScreen() {
  const handleLocationSelect = (location) => {
    // Store in React state or context
    // Navigate to next step
    router.push('/lost/add/when');
  };

  return <LocationPicker onLocationSelect={handleLocationSelect} />;
}
```

**`when.tsx`** - DateTime picker
```typescript
import { useState } from 'react';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Install: npm install @react-native-community/datetimepicker

export default function WhenScreen() {
  const [date, setDate] = useState(new Date());

  // Show date and time pickers
  // On confirm, navigate to /lost/add/name
}
```

**`name.tsx`** - Name & Description
```typescript
import { useForm } from 'react-hook-form';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';

export default function NameScreen() {
  // Two inputs: name (required), description (optional)
  // On submit, navigate to /lost/add/picture
}
```

**`picture.tsx`** - Image picker (optional for lost items)
```typescript
import * as ImagePicker from 'expo-image-picker';

export default function PictureScreen() {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Store image URI
      // TODO: Upload to backend if needed
    }
  };

  // Show "Take Photo" and "Choose from Library" buttons
  // Show "Skip" button (picture optional for lost items)
  // On confirm, navigate to /lost/add/review
}
```

**`review.tsx`** - Review all inputs
```typescript
import { useItems } from '../../../src/hooks/useItems';

export default function ReviewScreen() {
  const { createItemAsync } = useItems();

  const handleSubmit = async () => {
    await createItemAsync({
      type: 'lost',
      name: // from flow state,
      description: // from flow state,
      location: // from flow state,
      timestamp: // from flow state,
      imageUrl: // from flow state (optional),
    });

    router.push('/lost/add/posted');
  };

  // Display all info
  // "Confirm" button to submit
}
```

**`posted.tsx`** - Success confirmation
```typescript
export default function PostedScreen() {
  return (
    <View>
      <Ionicons name="checkmark-circle" size={80} color="green" />
      <Text>Your lost item has been posted!</Text>
      <Button
        title="View My Lost Items"
        onPress={() => router.push('/(tabs)/lost')}
      />
    </View>
  );
}
```

**State Management for Flow**:
Option A - Use React Context
Option B - Use a state management library
Option C - Pass params via router (simple but limited)

Recommended: Create `src/context/AddItemContext.tsx`:

```typescript
import { createContext, useContext, useState } from 'react';

interface AddItemState {
  location: string;
  coords?: { latitude: number; longitude: number };
  timestamp: string;
  name: string;
  description: string;
  imageUrl?: string;
}

const AddItemContext = createContext<{
  state: AddItemState;
  updateState: (updates: Partial<AddItemState>) => void;
  resetState: () => void;
} | null>(null);

export function AddItemProvider({ children }) {
  const [state, setState] = useState<AddItemState>({...});

  return (
    <AddItemContext.Provider value={{ state, updateState, resetState }}>
      {children}
    </AddItemContext.Provider>
  );
}

export const useAddItem = () => {
  const context = useContext(AddItemContext);
  if (!context) throw new Error('useAddItem must be within AddItemProvider');
  return context;
};
```

Then wrap the flow in `app/lost/add/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';
import { AddItemProvider } from '../../../src/context/AddItemContext';

export default function AddLostItemLayout() {
  return (
    <AddItemProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="location" />
        <Stack.Screen name="when" />
        <Stack.Screen name="name" />
        <Stack.Screen name="picture" />
        <Stack.Screen name="review" />
        <Stack.Screen name="posted" />
      </Stack>
    </AddItemProvider>
  );
}
```

#### 3. Find Tab - Match Feed
**Path**: `frontend/app/(tabs)/find.tsx`

Replace the placeholder with a full implementation:

```typescript
import { useState } from 'react';
import { FlatList, Dimensions } from 'react-native';
import { useItems } from '../../src/hooks/useItems';
import { usePotentialMatches, useMatches } from '../../src/hooks/useMatches';

export default function FindScreen() {
  const { items } = useItems('lost');
  const unfoundItems = items?.filter(i => i.status === 'unfound') || [];

  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(
    unfoundItems[0]?.id
  );

  const { potentialMatches, isLoading } = usePotentialMatches(selectedItemId);
  const { createMatchAsync } = useMatches();

  // 1. Dropdown to select unfound item
  // 2. Vertical FlatList with full-screen cards (TikTok style)
  // 3. Each card shows:
  //    - Found item image (required)
  //    - Name, description
  //    - Location, time
  //    - Match score (if backend provides)
  //    - "Claim" button

  const handleClaim = async (foundItem) => {
    // Show confirmation modal with all 4 attributes
    Alert.alert(
      'Claim this item?',
      `Name: ${foundItem.name}\nLocation: ${foundItem.location}...`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            await createMatchAsync({
              lostItemId: selectedItemId,
              foundItemId: foundItem.id,
            });
            // Navigate to scheduling
            router.push(`/scheduling/preference?matchId=${matchId}`);
          },
        },
      ]
    );
  };

  return (
    <View>
      {/* Dropdown for item selection */}
      <Picker
        selectedValue={selectedItemId}
        onValueChange={setSelectedItemId}
      >
        {unfoundItems.map(item => (
          <Picker.Item key={item.id} label={item.name} value={item.id} />
        ))}
      </Picker>

      {/* Vertical feed */}
      <FlatList
        data={potentialMatches}
        renderItem={({ item }) => (
          <View style={{ height: Dimensions.get('window').height - 200 }}>
            {/* Full-screen card with claim button */}
          </View>
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
```

**Matching Logic Note**:
The backend should return `potentialMatches` already ranked by score. If not, you'll need to implement client-side filtering/sorting as specified in the requirements.

#### 4. Found Tab
**Path**: `frontend/src/screens/tabs/FoundScreen.tsx`

Copy `LostScreen.tsx` and modify:

```typescript
// Same structure, but:
const { items } = useItems('found');

// Categories:
const categorizedItems = {
  found: items.filter(i => i.status === 'found'),
  matched: items.filter(i => i.status === 'matched'),
  returned: items.filter(i => i.status === 'returned'),
};

// renderCategory with different pill variants
renderCategory('Found', categorizedItems.found, 'unfound'); // red
renderCategory('Matched', categorizedItems.matched, 'matched'); // orange
renderCategory('Returned', categorizedItems.returned, 'returned'); // green

// On item press:
// - If matched: navigate to scheduling
// - Otherwise: navigate to detail
```

#### 5. Add Found Item Flow
**Folder**: `frontend/app/found/add/`

Same as Lost Item flow, but:
- **Picture is REQUIRED** (no skip option)
- Validate that image is selected before proceeding
- Otherwise identical structure

#### 6. Scheduling Flow
**Folder**: `frontend/app/scheduling/`

**`preference.tsx`** - Return method selection
```typescript
import { useLocalSearchParams } from 'expo-router';
import { useMatches } from '../../src/hooks/useMatches';

export default function PreferenceScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { updatePreferenceAsync } = useMatches();

  const handleSelect = async (preference: ReturnMethod) => {
    await updatePreferenceAsync({
      id: matchId,
      data: { returnMethodPreference: preference },
    });

    router.push(`/scheduling/waiting?matchId=${matchId}`);
  };

  return (
    <View>
      <Text>How would you like to return/retrieve this item?</Text>

      <Button
        title="Local Lost and Found"
        onPress={() => handleSelect('local_lost_and_found')}
      />

      <Button
        title="In Person"
        onPress={() => handleSelect('in_person')}
      />

      <Button
        title="I don't mind"
        onPress={() => handleSelect('no_preference')}
      />
    </View>
  );
}
```

**`waiting.tsx`** - Waiting for other user
```typescript
export default function WaitingScreen() {
  const { matchId } = useLocalSearchParams();
  const { matches, refetch } = useMatches();
  const match = matches?.find(m => m.id === matchId);

  useEffect(() => {
    // Poll every 5 seconds for updates
    const interval = setInterval(refetch, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if both preferences are set
    if (match?.lostUserPreference && match?.foundUserPreference) {
      // Resolve decision (implement resolution logic per requirements)
      const resolved = resolveReturnMethod(
        match.lostUserPreference,
        match.foundUserPreference
      );

      if (resolved === 'in_person') {
        router.replace(`/scheduling/in-person?matchId=${matchId}`);
      } else {
        router.replace(`/scheduling/lost-and-found?matchId=${matchId}`);
      }
    }
  }, [match]);

  return (
    <View>
      <ActivityIndicator />
      <Text>Waiting for the other person to respond...</Text>
    </View>
  );
}

function resolveReturnMethod(lost, found) {
  // Rules from requirements:
  // - If both "don't mind" → in_person
  // - If both "in_person" → in_person
  // - If either "local_lost_and_found" → local_lost_and_found

  if (lost === 'local_lost_and_found' || found === 'local_lost_and_found') {
    return 'local_lost_and_found';
  }

  return 'in_person';
}
```

**`in-person.tsx`** - Contact info display
```typescript
export default function InPersonScreen() {
  const { matchId } = useLocalSearchParams();
  const { matches } = useMatches();
  const match = matches?.find(m => m.id === matchId);
  const { currentUser } = useAuth();

  // Determine if user is the finder or the lost person
  const isFinder = match?.foundUserId === currentUser?.id;
  const otherUser = isFinder ? match?.lostUser : match?.foundUser;

  return (
    <View>
      <Text>Contact Information</Text>
      <Text>{otherUser?.email}</Text>
      <Text>Arrange a meetup time and location directly.</Text>
    </View>
  );
}
```

**`lost-and-found.tsx`** - Location selection for drop-off
```typescript
export default function LostAndFoundScreen() {
  const { matchId } = useLocalSearchParams();
  const { currentUser } = useAuth();
  const { matches, notifyReturn } = useMatches();
  const match = matches?.find(m => m.id === matchId);

  const isFinder = match?.foundUserId === currentUser?.id;

  if (isFinder) {
    // Finder view
    const [returnLocation, setReturnLocation] = useState('');
    const [hasReturned, setHasReturned] = useState(match?.hasNotified || false);

    const handleNotify = async () => {
      await notifyReturn(matchId);
      setHasReturned(true);
    };

    return (
      <View>
        <LocationPicker
          onLocationSelect={(loc) => {
            setReturnLocation(loc.address);
            // Update match with return location
          }}
        />

        {!hasReturned && returnLocation && (
          <Button title="Notify - Item Returned" onPress={handleNotify} />
        )}

        {hasReturned && (
          <Text>✅ Notification sent!</Text>
        )}
      </View>
    );
  } else {
    // Lost person view
    return (
      <View>
        <Text>Finder will return item to:</Text>
        <Text>{match?.returnLocation || 'Location not set yet'}</Text>
        <Text>You'll be notified when it's returned.</Text>
      </View>
    );
  }
}
```

### Priority 2: Polish & Enhancement

#### Image Upload
The current flow stores image URIs locally. You'll need to:

1. Create an upload function:
```typescript
// src/api/upload.ts
export const uploadImage = async (uri: string): Promise<string> => {
  const formData = new FormData();
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename || '');
  const type = match ? `image/${match[1]}` : 'image';

  formData.append('image', {
    uri,
    name: filename,
    type,
  } as any);

  const response = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.url; // Backend should return image URL
};
```

2. Use in add item flows:
```typescript
// In review.tsx
let imageUrl = undefined;
if (state.imageUri) {
  imageUrl = await uploadImage(state.imageUri);
}
```

#### Notifications UI
Create a notifications screen accessible from header:

```typescript
// app/(tabs)/_layout.tsx - Add header button
import { Ionicons } from '@expo/vector-icons';

<Tabs.Screen
  name="lost"
  options={{
    headerShown: true,
    headerRight: () => (
      <TouchableOpacity onPress={() => router.push('/notifications')}>
        <Ionicons name="notifications-outline" size={24} />
      </TouchableOpacity>
    ),
  }}
/>
```

#### Error Handling
Wrap API calls in try-catch and show user-friendly errors:

```typescript
const handleSubmit = async () => {
  try {
    await createItemAsync(data);
    router.push('/posted');
  } catch (error) {
    Alert.alert(
      'Error',
      error.response?.data?.message || 'Something went wrong',
      [{ text: 'OK' }]
    );
  }
};
```

#### Loading States
Show loading indicators during API calls:

```typescript
if (isLoading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}
```

### Priority 3: Cartes.io Integration

All map integration is centralized in `src/components/maps/LocationPicker.tsx`.

Follow the TODO comments in that file:

1. Install Cartes.io SDK
2. Replace placeholder View with actual map component
3. Connect pin selection to `onLocationSelect` callback
4. Test in all flows (Add Lost Item, Add Found Item, Lost & Found scheduling)

## 🧪 Testing Checklist

### Auth Flow
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Logout and verify redirect
- [ ] Token persists across app restarts

### Lost Items
- [ ] Create lost item through full flow
- [ ] View lost item details
- [ ] Delete unfound item
- [ ] Item moves to "found" when matched

### Found Items
- [ ] Create found item (with required image)
- [ ] View found item details
- [ ] Item moves to "matched" when claimed

### Matching
- [ ] Find tab shows potential matches
- [ ] Claim match creates match record
- [ ] Both users see scheduling flow

### Scheduling
- [ ] Preference selection saves correctly
- [ ] Waiting screen updates when other user responds
- [ ] Decision resolution follows rules
- [ ] In-person shows contact info
- [ ] Lost & Found allows location selection
- [ ] Notify button updates status

### Settings
- [ ] Theme toggle works and persists
- [ ] Logout works
- [ ] All settings sections navigate correctly

## 📚 Helpful Resources

### Components Already Built
- `Button` - src/components/common/Button.tsx
- `Input` - src/components/common/Input.tsx
- `Card` - src/components/common/Card.tsx
- `LiquidPill` - src/components/common/LiquidPill.tsx
- `LocationPicker` - src/components/maps/LocationPicker.tsx

### Hooks Available
- `useAuth()` - src/hooks/useAuth.ts
- `useItems(type?)` - src/hooks/useItems.ts
- `useItem(id)` - src/hooks/useItems.ts
- `useMatches(params?)` - src/hooks/useMatches.ts
- `usePotentialMatches(lostItemId)` - src/hooks/useMatches.ts
- `useAppTheme()` - src/theme/index.ts
- `useTheme()` - src/theme/index.ts (for setTheme)

### API Endpoints
All defined in `src/api/`:
- `authApi` - src/api/auth.ts
- `itemsApi` - src/api/items.ts
- `matchesApi` - src/api/matches.ts
- `notificationsApi` - src/api/notifications.ts

### Expo Router Patterns
```typescript
// Navigate
import { router } from 'expo-router';
router.push('/path');
router.replace('/path'); // No back button
router.back();

// Get params
import { useLocalSearchParams } from 'expo-router';
const { id } = useLocalSearchParams<{ id: string }>();

// Pass params
router.push(`/detail/${itemId}`);
router.push(`/schedule?matchId=${matchId}`);
```

### Styling Patterns
```typescript
// Always use theme
const theme = useAppTheme();

// Colors
backgroundColor: theme.colors.background
color: theme.colors.text

// Spacing
marginTop: theme.spacing.md
padding: theme.spacing.lg

// Shadows
...theme.shadows.md

// Border radius
borderRadius: theme.borderRadius.lg

// Typography
...theme.typography.h2
...theme.typography.body
```

## 🐛 Common Issues & Solutions

### Issue: "Can't find variable: router"
**Solution**: Import from expo-router:
```typescript
import { router } from 'expo-router';
```

### Issue: White screen on app start
**Solution**: Check console for errors. Likely causes:
- Missing navigation configuration
- Uncaught error in component
- Check app.json has `"scheme": "lostandfound"`

### Issue: Backend connection fails
**Solution**:
- Check `.env` has correct URL
- Android: Use `10.0.2.2` instead of `localhost`
- iOS: Use `localhost`
- Physical device: Use computer's local IP

### Issue: Theme not applying
**Solution**: Make sure you're using `theme.colors.xxx` not hardcoded colors

### Issue: React Query not refetching
**Solution**:
- Check `queryClient.invalidateQueries` is called after mutations
- Verify queryKey matches between query and invalidation

## 📝 Code Style Guidelines

1. **File naming**: PascalCase for components, camelCase for utilities
2. **Component structure**:
   - Imports
   - Types/interfaces
   - Component
   - Styles at bottom
3. **Always use TypeScript types** - no `any` unless absolutely necessary
4. **Extract reusable logic** into hooks
5. **Keep components focused** - break into smaller components if > 300 lines
6. **Use functional components** with hooks, no class components
7. **Consistent spacing** - 2 spaces, not tabs

## 🎯 Success Criteria

The app is complete when:
- [ ] All screens from requirements are implemented
- [ ] Full flow works end-to-end
- [ ] No console errors or warnings
- [ ] Works on both light and dark mode
- [ ] Works on both iOS and Android
- [ ] Backend integration is successful
- [ ] All form validations work
- [ ] Images can be uploaded
- [ ] Cartes.io integration is complete

Good luck! Follow the patterns established and you'll build a great app. 🚀
