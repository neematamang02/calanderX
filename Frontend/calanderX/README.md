# CalendarX Frontend

A modern React frontend for the CalendarX calendar management application.

## Features

- **Authentication**: Secure login/register with JWT tokens
- **OAuth Integration**: Connect Google and Microsoft calendar accounts
- **Calendar Management**: Sync and manage multiple calendars
- **Custom Boards**: Create personalized calendar views with filtering and masking
- **Public Sharing**: Generate shareable links for calendar boards
- **Real-time Sync**: Automatic calendar and event synchronization
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 19** with TypeScript
- **React Router** for navigation
- **React Query** for server state management
- **React Hook Form** for form handling
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Date-fns** for date manipulation
- **Lucide React** for icons
- **React Toastify** for notifications

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:3001`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```env
VITE_API_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── calendar/       # Calendar-specific components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Page components
├── services/           # API service functions
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Components

### Authentication
- JWT-based authentication with automatic token refresh
- Protected routes with redirect to login
- Persistent login state

### API Integration
- Comprehensive API client with error handling
- React Query for caching and synchronization
- Automatic retry and background refetch

### Calendar Management
- OAuth flow for Google and Microsoft calendars
- Real-time calendar and event synchronization
- Calendar activation/deactivation

### Board System
- Custom calendar views with filtering options
- Event masking for privacy
- Date range controls (past/future limits, current week, etc.)
- Color customization for calendars

### Sharing System
- Public shareable links for boards
- View analytics and access control
- Token regeneration for security

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints

The frontend communicates with the following backend endpoints:

### Authentication
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login

### OAuth
- `GET /api/oauth/connect/:provider` - Initiate OAuth flow
- `GET /api/oauth/callback/:provider` - OAuth callback
- `GET /api/oauth/accounts` - Get connected accounts
- `DELETE /api/oauth/accounts/:id` - Disconnect account

### Calendars
- `GET /api/calendars` - Get user calendars
- `POST /api/calendars/events` - Get calendar events
- `POST /api/calendars/sync/all` - Sync all user data

### Boards
- `GET /api/boards` - Get user boards
- `POST /api/boards` - Create board
- `GET /api/boards/:id` - Get board details
- `PATCH /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Sharing
- `POST /api/share/boards/:id` - Create shared link
- `GET /api/share/public/:token` - Get public board (no auth)

## Environment Variables

- `VITE_API_URL` - Backend API base URL (default: http://localhost:3001)

## Development

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Consistent component patterns
- Custom hooks for reusable logic

### State Management
- React Query for server state
- React Context for authentication
- Local state with useState/useReducer

### Error Handling
- Global error boundaries
- Toast notifications for user feedback
- Graceful API error handling

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Add proper error handling and loading states
4. Test components thoroughly
5. Update documentation as needed

## License

This project is part of the CalendarX application suite.