# Collaborative Whiteboard

A real-time collaborative whiteboard application built with React, TypeScript, Vite, and Supabase. Draw together with others in real-time with persistent storage and secure authentication.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

## Features

✨ **Real-time Drawing** - See changes instantly  
👥 **Collaborative** - Multiple users drawing simultaneously  
🔐 **Secure Auth** - Supabase authentication  
💾 **Persistent** - All drawings saved to database  
📱 **Responsive** - Works on desktop and mobile  

## Setup

See [SETUP.md](./SETUP.md) for detailed setup instructions including:
- Creating a Supabase project
- Database schema creation
- Environment configuration
- Deployment options

## Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Build**: Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
