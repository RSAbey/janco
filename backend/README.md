# Janco Construction Management Backend

A robust Node.js/Express backend API for the Janco Construction Management System.

## Features

- **JWT Authentication** with role-based access control
- **Three User Roles**: Employee, Supervisor, Manager
- **RESTful APIs** for all construction management modules
- **MongoDB Integration** with Mongoose ODM
- **Security Features**: Helmet, CORS, Rate limiting
- **Input Validation** with express-validator
- **File Upload Support** with Multer

## Quick Start

1. **Install Dependencies**
   \`\`\`bash
   cd backend
   npm install
   \`\`\`

2. **Environment Setup**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (Manager only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Manager only)

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## User Roles

- **Employee**: Basic access to assigned projects and tasks
- **Supervisor**: Manage projects, employees, and site operations
- **Manager**: Full system access including user management and reports

## Security

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS protection
- Helmet security headers
