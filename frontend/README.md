# RizQ Frontend

React + Vite + TypeScript + Tailwind CSS + shadcn/ui

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create Environment File**
   
   Copy the example environment file and update with your values:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   The app will be available at http://localhost:5173

## Default Credentials

- Username: `admin`
- Password: `admin123!`

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Shared components
│   │   ├── ui/          # shadcn/ui components
│   │   └── ProtectedRoute.tsx
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/           # Page components
│   │   ├── Login.tsx
│   │   └── Dashboard.tsx
│   ├── services/        # API services
│   │   ├── api.ts
│   │   └── authService.ts
│   ├── types/           # TypeScript types
│   │   └── auth.ts
│   ├── utils/           # Utility functions
│   │   └── cn.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables (create from .env.example)
├── .env.example         # Example environment file
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Technologies

- **React 18** - UI library
- **Vite** - Build tool & dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **Lucide React** - Icons

## Features

- ✅ JWT Authentication
- ✅ Protected Routes
- ✅ Login/Logout Flow
- ✅ Tailwind CSS styling
- ✅ shadcn/ui components
- ✅ TypeScript support
- ✅ Axios with interceptors

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Next Steps

1. ✅ Basic authentication working
2. ⏳ Add recipient management pages
3. ⏳ Add courier management pages
4. ⏳ Add assignment creation wizard
5. ⏳ Integrate Google Maps
6. ⏳ Add route optimization features
