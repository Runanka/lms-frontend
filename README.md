# Skillwise LMS Frontend

A modern Learning Management System frontend built with Next.js 15, featuring a clean UI inspired by contemporary design patterns.

## Features

### For Students
- **Browse Courses** - Discover and enroll in courses
- **Learning Paths** - Follow structured multi-course journeys
- **Progress Tracking** - Track completion across courses and paths
- **Interactive Learning** - Watch videos, read documents, complete assignments
- **Course Discussion** - Chat with other learners per course
- **MCQ & Subjective Assignments** - Complete quizzes and written assignments

### For Coaches
- **Course Creation** - Build courses with modules, resources, and assignments
- **Path Creation** - Curate collections of your courses into learning paths
- **Assignment Management** - Create MCQ and subjective assignments
- **Submission Review** - Grade student submissions

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State Management**: Zustand (with persistence)
- **Authentication**: Zitadel (OAuth2/OIDC with PKCE)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running (see [lms backend](https://github.com/Runanka/lms-backend))
- Zitadel instance configured

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3008/api
NEXT_PUBLIC_ZITADEL_AUTHORITY=http://localhost:8080
NEXT_PUBLIC_ZITADEL_CLIENT_ID=your_client_id
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
lms-frontend/
├── app/
│   ├── (auth)/              # Auth routes (callback, role selection)
│   │   ├── callback/        # OAuth callback handler
│   │   └── select-role/     # Post-auth role selection
│   ├── (dashboard)/         # Protected routes
│   │   ├── courses/         # Course listing & details
│   │   ├── paths/           # Learning path listing & details
│   │   ├── my-courses/      # Student's enrolled courses
│   │   ├── my-paths/        # Student's started paths
│   │   ├── learn/[id]/      # Course learning interface
│   │   ├── create-course/   # Course creation (coaches)
│   │   ├── create-path/     # Path creation (coaches)
│   │   └── submissions/     # Submission review (coaches)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── Comments.tsx         # Course discussion component
├── lib/
│   ├── api.ts               # API client functions
│   ├── auth.ts              # Auth utilities (PKCE, token exchange)
│   ├── auth-store.ts        # Zustand auth store
│   └── utils.ts             # Utility functions
├── types/
│   └── index.ts             # TypeScript interfaces
└── public/                  # Static assets
```

## Authentication Flow

1. User clicks **Sign In** or **Sign Up** on landing page
2. Redirected to Zitadel with PKCE challenge
3. After authentication, redirected to `/callback`
4. Token exchanged, user fetched from backend
5. If no role set → redirected to `/select-role`
6. After role selection → redirected to `/courses`

## Key Pages

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing page | Public |
| `/courses` | Browse/manage courses | Authenticated |
| `/courses/[id]` | Course details | Authenticated |
| `/courses/[id]/edit` | Edit course | Coach (owner) |
| `/paths` | Browse/manage paths | Authenticated |
| `/paths/[id]` | Path details | Authenticated |
| `/my-courses` | Enrolled courses | Student |
| `/my-paths` | Started paths | Student |
| `/learn/[id]` | Learning interface | Student (enrolled) |
| `/create-course` | Create new course | Coach |
| `/create-path` | Create new path | Coach |
| `/submissions/[id]` | Review submissions | Coach |

## Design System

The UI follows a consistent design language:

- **Primary Color**: Violet (`violet-600`)
- **Secondary Color**: Indigo (for paths)
- **Cards**: White with subtle borders, hover shadows
- **Typography**: Clean, modern sans-serif
- **Animations**: Subtle transitions, skeleton loading states

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 5173 |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
