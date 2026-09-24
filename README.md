# README

## Project name

**dynamic-workflow-management**

## Description

A dynamic workflow management system built with a React frontend and an Express backend.

## Technology stack

- React + Vite (frontend)
- Node.js + Express.js (backend)
- npm (package manager)

## Project structure

```text
dynamic-workflow-management/
├── frontend/    # React + Vite application
├── backend/     # Node.js + Express.js application
├── camunda/     # BPMN workflow files (future)
├── docker/      # Docker configuration files (future)
├── docs/        # Documentation (future)
├── .env.example
├── .gitignore
└── package.json
```

## Setup

1. Install root project metadata:

```sh
npm install
```

2. Install frontend dependencies:

```sh
npm --prefix frontend install
```

3. Install backend dependencies:

```sh
npm --prefix backend install
```

4. Copy `.env.example` to `.env` and set the values.

5. Start the frontend:

```sh
npm --prefix frontend run dev
```

6. Start the backend:

```sh
npm --prefix backend run dev
```