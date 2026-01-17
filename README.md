# Campus Lost & Found API

A full-stack lost and found application for campus communities with AI-powered matching, user authentication, and real-time notifications.

## 🚀 Features

- **User Authentication** - Secure registration and login with JWT tokens
- **Lost/Found Item Management** - Post and manage lost or found items
- **AI-Powered Matching** - Intelligent matching between lost and found items
- **Real-time Notifications** - Get notified about potential matches
- **Match Confirmation System** - Two-way confirmation process for item recovery
- **Image Support** - Upload and store item images

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd LostAndFound
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### 3. Database Setup

This project uses **Neon** (serverless PostgreSQL). Follow these steps:

#### Option A: Use Existing Database (Recommended for Team)
The project already has a Neon database configured. Just use the existing `.env` file.

#### Option B: Set Up Your Own Database
1. Install Neon CLI and initialize:
   ```bash
   cd ..  # Go to root directory
   npx neonctl@latest init
   ```

2. Follow the prompts to authenticate and create a database

3. Copy your database connection string and update `backend/.env`:
   ```env
   DATABASE_URL="your-neon-connection-string"
   ```

### 4. Environment Variables

The `backend/.env` file should contain:

```env
# Database Configuration
DATABASE_URL="postgresql://neondb_owner:npg_NqA0dC8ZBMrY@ep-old-king-ahhbcppn-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# JWT Configuration
JWT_SECRET="your_super_secret_jwt_key_change_this_in_production_12345"

# Server Configuration
PORT=8000
NODE_ENV="development"

# OpenAI API (Optional - for AI embeddings)
OPENAI_API_KEY="your_openai_key_optional"
```

### 5. Generate Prisma Client

```bash
cd backend
npx prisma generate
```

### 6. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will create all the necessary database tables.

## 🏃 Running the Application

### Start the Backend Server

```bash
cd backend
npm start
```

The server will start at `http://localhost:8000`

You should see:
```
✅ Database connected successfully
╔════════════════════════════════════════════╗
║  Campus Lost & Found API                   ║
║  Status: Running ✅                        ║
║  Port: 8000                              ║
║  Environment: development                  ║
║  URL: http://localhost:8000             ║
╚════════════════════════════════════════════╝
```

### Development Mode (with auto-reload)

For development, you can use nodemon for auto-reload:

```bash
npm run dev
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Items (Requires Authentication)
- `POST /api/items` - Create a new lost/found item
- `GET /api/items` - Get all user's items
- `GET /api/items/:id` - Get single item
- `PATCH /api/items/:id/status` - Update item status

### Matches (Requires Authentication)
- `GET /api/matches/:itemId` - Get matches for an item
- `POST /api/matches/:matchId/confirm` - Confirm a match
- `POST /api/matches/:matchId/reject` - Reject a match

### Notifications (Requires Authentication)
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/mark-all-read` - Mark all as read
- `POST /api/notifications/:id/read` - Mark single as read
- `DELETE /api/notifications/:id` - Delete notification

### Health Check
- `GET /` - Check API status

## 🗂️ Project Structure

```
LostAndFound/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── auth/
│   │   │   ├── auth.js         # Auth utilities
│   │   │   └── middleware.js   # Auth middleware
│   │   ├── config/
│   │   │   └── index.js        # Configuration
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── itemsController.js
│   │   │   ├── matchesController.js
│   │   │   └── notificationsController.js
│   │   ├── database/
│   │   │   └── prisma.js       # Database connection
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── items.js
│   │   │   ├── matches.js
│   │   │   └── notifications.js
│   │   ├── utils/
│   │   │   ├── embeddings.js   # AI embeddings
│   │   │   ├── notifications.js
│   │   │   └── similarity.js
│   │   └── main.js             # Entry point
│   ├── .env                    # Environment variables
│   ├── .gitignore
│   └── package.json
└── mobile/                     # React Native app (future)
```

## 🔧 Useful Commands

```bash
# Install dependencies
npm install

# Start server
npm start

# Start in development mode
npm run dev

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# View database
npx prisma studio
```

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
cd backend
npm install
```

### Database connection errors
- Check your `DATABASE_URL` in `.env`
- Ensure Neon database is active
- Run `npx prisma generate` and `npx prisma migrate dev`

### Port already in use
- Change the `PORT` in `.env` file
- Or kill the process using port 8000:
  ```bash
  lsof -ti:8000 | xargs kill
  ```

## 👥 Team Collaboration

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Install any new dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Run migrations if schema changed:**
   ```bash
   npx prisma migrate dev
   ```

4. **Start your server:**
   ```bash
   npm start
   ```

## 📝 Notes

- The AI matching currently uses placeholder embeddings (random vectors)
- To enable real AI matching, add your OpenAI API key to `.env`
- Database is shared among team members - be careful with migrations
- Don't commit the `.env` file to git (it's in `.gitignore`)

## 🔐 Security

- Change `JWT_SECRET` in production
- Never commit `.env` file
- Use environment variables for sensitive data
- Keep dependencies updated

