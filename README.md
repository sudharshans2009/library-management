# SS.library - Library Management System

SS.library is a modern, full-stack library management system built with Next.js, TypeScript, Drizzle ORM, and Better Auth. It provides robust features for students, teachers, and administrators to manage books, borrowing, requests, and user accounts efficiently.

## Features

- **User Authentication & Roles:** Secure login, registration, and role-based access (User, Admin, Moderator).

- **Book Management:** Add, edit, delete, and view books with cover images, genres, ratings, and media.

- **Borrowing System:** Request, approve, and track book borrowings with due dates and return management.

- **Request Handling:** Users can submit requests (extensions, lost/damage reports, early returns, etc.) and admins can review/respond.

- **Admin Dashboard:** Analytics, quick actions, recent activity, and system health monitoring.

- **User Management:** Approve, reject, suspend, and change roles for users.

- **CSV Export:** Export users, books, and borrow records to CSV for reporting.

- **Responsive UI:** Built with React, Tailwind CSS, and shadcn/ui components.

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui

- **Backend:** Next.js API routes, Drizzle ORM, Neon/Postgres

- **Authentication:** Better Auth

- **Database:** PostgreSQL (schema managed with Drizzle)

- **File Storage:** Local/Cloud (for book covers, videos, profile images)

## Project Structure

```
actions/         # Server actions (books, records, requests, setup, upload, etc.)
app/             # Next.js app directory (routes, pages, layouts)
components/      # Reusable UI and form components
database/        # Drizzle ORM config and schema definitions
emails/          # Email templates (verification, reset password)
hooks/           # Custom React hooks
lib/             # Utilities, config, and service logic
schemas/         # Zod schemas for validation
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon or local)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://github.com/Better-Auth)

### Setup

1. **Clone the repository:**

   ```sh
   git clone https://github.com/your-org/library-management-v2.git
   cd library-management-v2
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Configure environment variables:**

   - Copy `.env.example` to `.env` and fill in your database and auth credentials.

4. **Run database migrations:**

   ```sh
   npm run drizzle:push
   ```

5. **Start the development server:**

   ```sh
   npm run dev
   ```

6. **Access the app:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- **User Registration:** Sign up and complete the setup process (class, section, roll number).
- **Book Borrowing:** Browse books, request to borrow, and track your records.
- **Requests:** Submit requests for extensions, lost/damage, or other needs.
- **Admin Panel:** `/admin` for managing users, books, records, and requests.

## Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run drizzle:push` - Push Drizzle ORM migrations

## License

MIT

---

> _Made by Sudharshan S for SS.library_
