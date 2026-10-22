# OmniHub

OmniHub is being structured as a unified platform with 12 independently
developable modules. The repository uses a modular monolith direction for the
future backend; the frontend and backend remain separate applications.

## Project structure

- `frontend/` — Next.js App Router application using React, TypeScript, and
  Tailwind CSS.
- `backend/` — Node.js, Express, and TypeScript application scaffold.
- `frontend/src/app/` — application routes, with reserved directories for
  ecommerce, jobs, education, social, business, healthcare, services, travel,
  property, AI, finance, and productivity.
- `frontend/src/features/` — reserved frontend feature-module directories for
  the same 12 areas.
- `backend/src/modules/` — reserved backend module directories for the 12
  platform areas, plus auth and users.

The module and shared-layer directories are intentionally empty until their
implementation begins. Database selection and integration are also deferred.

## Requirements

- Node.js 20 or newer
- npm

## Install dependencies

Frontend and backend dependencies are installed independently:

```sh
npm install --prefix frontend
npm install --prefix backend
```

## Development and build

Run each application from the repository root:

```sh
npm run dev:frontend
npm run dev:backend
```

Build and start either application:

```sh
npm run build:frontend
npm run start:frontend
npm run build:backend
npm run start:backend
```

The frontend development server uses Next.js defaults. The backend listens on
port `4000` unless `PORT` is set.

Copy the relevant `.env.example` to `.env` when local environment configuration
is needed. The examples contain placeholder variable names only.
