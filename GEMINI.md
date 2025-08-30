# Gemini Code Assistant Guide

This document provides a guide for using the Gemini code assistant with the Android Remote Diagnostic API project.

## Project Overview

This project is a comprehensive REST API server designed to run on an Android device using Termux. It allows for remote monitoring, debugging, and management of the device. The server exposes a wide range of functionalities through a REST API and includes a web-based dashboard for easy interaction with over 36 integrated debugging tools.

## Technologies

The project is built with the following technologies:

-   **Backend:** Node.js, Express.js
-   **Frontend (Dashboard):** HTML, CSS, JavaScript, Bootstrap 5
-   **Database:** NeDB (for local data storage)
-   **Environment:** Termux on Android
-   **Linting:** ESLint
-   **Formatting:** Prettier
-   **Containerization:** Docker

## Project Structure

The project is organized as follows:

```
.
├── src/
│   ├── app.js               # Express app configuration
│   ├── server.js            # Main server entry point
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── models/              # Database models
│   └── routes/              # API route definitions
├── public/                  # Static files for the web dashboard
├── data/                    # Database files
├── node_modules/            # Project dependencies
├── .dockerignore            # Docker ignore file
├── .eslintrc.js             # ESLint configuration
├── .gitignore               # Git ignore file
├── .prettierrc              # Prettier configuration
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Dockerfile for production
├── package.json             # Project metadata and dependencies
└── README.md                # Project documentation
```

## Available Scripts

The following scripts are available in `package.json`:

-   `npm start`: Starts the server in production mode.
-   `npm run dev`: Starts the server in development mode with nodemon for auto-reloading.
-   `npm run lint`: Lints the codebase using ESLint.
-   `npm run lint:fix`: Lints the codebase and automatically fixes issues.
-   `npm run format`: Formats the code using Prettier.
-   `npm run format:check`: Checks the formatting of the code.
-   `npm test`: Runs the linter and format checker.

## Common Tasks

Here are some common tasks you can perform with the help of Gemini:

### Starting the server

To start the server in development mode, you can use the following command:

```bash
npm run dev
```

### Running tests

To run the test suite, which includes linting and format checking, use:

```bash
npm test
```

### Adding a new API endpoint

To add a new API endpoint, you would typically:

1.  Create a new file in the `src/routes/` directory (e.g., `src/routes/new-feature.js`).
2.  Define the new routes in this file using an Express router.
3.  Import and use the new router in `src/app.js`.

**Example Prompt:** "Create a new API endpoint `/api/hello` that returns a JSON object with the message 'Hello, World!'."

### Modifying the web dashboard

The web dashboard is located in the `public/` directory. To modify it, you can edit the HTML, CSS, and JavaScript files in this directory.

**Example Prompt:** "Add a new button to the `public/index.html` file with the text 'Click me'."
