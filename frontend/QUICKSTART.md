# Lost + Found - Quick Start Guide

## 📱 What You Have

A **production-ready foundation** for the Lost & Found mobile app with:

✅ Complete authentication system (Sign In/Sign Up)
✅ Secure JWT token management
✅ Bottom tab navigation (Lost/Find/Found/Settings)
✅ Lost items list with categorization
✅ Settings screen with theme toggle
✅ Modern black & white UI with liquid pill effects
✅ Full API integration layer
✅ Light/Dark mode support
✅ TypeScript throughout

## 🚀 Get Started in 3 Steps

### 1. Install & Configure

```bash
cd frontend
npm install

# Configure backend URL
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_API_URL to your backend (default: http://localhost:8000)
```

### 2. Start the App

```bash
# Start Expo
npm start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator  
# - 'w' for web browser
```

### 3. Test What's Built

1. **Sign Up** - Create a new account
2. **Sign In** - Login with credentials  
3. **Lost Tab** - View categorized lost items
4. **Settings** - Toggle theme, view account options

## 📂 Project Structure

```
frontend/
├── app/                      # Expo Router routes
│   ├── (auth)/              # Auth screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/              # Main tabs
│   │   ├── lost.tsx         ✅ COMPLETE
│   │   ├── find.tsx         🚧 TODO
│   │   ├── found.tsx        🚧 TODO
│   │   └── settings.tsx     ✅ COMPLETE
│   └── _layout.tsx          # Root with providers
├── src/
│   ├── api/                 # API clients ✅
│   ├── components/          # UI components ✅
│   ├── hooks/               # React Query hooks ✅
│   ├── screens/             # Screen components
│   ├── theme/               # Theme system ✅
│   └── types/               # TypeScript types ✅
└── .env                     # Configuration
```

## 🎯 What's Next

See `IMPLEMENTATION_GUIDE.md` for detailed instructions on building:

### Must Implement
1. **Lost Item Detail** (`app/lost/[id].tsx`)
2. **Add Lost Item Flow** (`app/lost/add/*`)
3. **Find Tab** - Match feed
4. **Found Tab** - Similar to Lost tab
5. **Add Found Item Flow** (`app/found/add/*`)
6. **Scheduling Flow** (`app/scheduling/*`)

### Nice to Have
- Image upload functionality
- Notifications screen
- Enhanced error handling
- Loading states everywhere
- Cartes.io map integration

## 🔧 Common Commands

```bash
# Clear cache and restart
npm start -- --clear

# Run on specific platform
npm run ios
npm run android
npm run web

# Check for issues
npx expo doctor
```

## 🐛 Troubleshooting

**Can't connect to backend?**
- iOS/Web: Use `http://localhost:8000`
- Android Emulator: Use `http://10.0.2.2:8000`  
- Physical Device: Use your computer's local IP

**White screen on launch?**
- Check terminal for errors
- Verify `app.json` has `"main": "expo-router/entry"`
- Try clearing cache: `npm start -- --clear`

**Theme not working?**
- Always use `theme.colors.*` from `useAppTheme()`
- Never hardcode colors

**TypeScript errors?**
- Run `npx expo install --check`
- Restart TypeScript server in your editor

## 📖 Documentation

- **README.md** - Project overview and setup
- **IMPLEMENTATION_GUIDE.md** - Step-by-step implementation guide
- **QUICKSTART.md** - This file

## 💡 Tips

1. **Follow the patterns** - Look at `LostScreen.tsx` and `SignInScreen.tsx` as examples
2. **Use the hooks** - All API calls have React Query hooks ready
3. **Theme everything** - Use `useAppTheme()` for consistent styling
4. **Test as you go** - Run the app frequently to catch issues early

## 🎨 Design System

**Colors**: Black & white minimal
**Accents**: Red (unfound), Orange (found/matched), Green (returned)
**Components**: Button, Input, Card, LiquidPill
**Navigation**: File-based with Expo Router

## 🔐 Backend Integration

The app expects these endpoints on your backend:

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in  
- `GET /api/auth/me` - Get current user
- `GET /api/items` - Get items (query: `?type=lost|found`)
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/matches/potential/:lostItemId` - Get match suggestions
- `POST /api/matches` - Create match
- `PUT /api/matches/:id/preference` - Set return preference
- `POST /api/matches/:id/notify` - Notify item returned

All API calls include `Authorization: Bearer <token>` header automatically.

## 📞 Need Help?

1. Check `IMPLEMENTATION_GUIDE.md` for detailed instructions
2. Review existing code in `src/screens/tabs/LostScreen.tsx`
3. Check Expo Router docs: https://docs.expo.dev/router/introduction/

---

**You have a solid foundation. Now build the rest! 🚀**
