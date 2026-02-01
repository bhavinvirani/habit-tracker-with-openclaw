# Frontend Application

React-based frontend for the Habit Tracker application.

## Features

- **Dashboard**: Overview of all habits and statistics
- **Habit Management**: Create, edit, and delete habits
- **Tracking**: Log daily habit completions
- **Analytics**: Visual charts and insights
- **Profile**: User profile and settings

## Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8080/api
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── services/        # API services
├── store/           # State management
├── utils/           # Utility functions
├── types/           # TypeScript types
└── styles/          # Global styles
```
