# Medium MCP API Server

A Model Context Protocol (MCP) server that integrates with Medium's API to enable seamless content publishing and user account management from external applications. The Model Context Protocol provides a standardized way for AI models to interact with external services and APIs, allowing this server to serve as a bridge between AI assistants and the Medium publishing platform.

## 🚀 Features

- **Authentication & User Management**
  - Secure Medium OAuth integration
  - JWT-based authentication
  - User profile management

- **Content Publishing**
  - Support for Markdown and HTML content formats
  - Draft creation and management
  - Post scheduling
  - Publication integration
  - Tag and category support

- **Media Management**
  - Image upload and storage
  - Content formatting utilities

- **Reliability & Performance**
  - Redis-based caching
  - Job scheduling for post publication
  - Comprehensive error handling
  - Rate limiting

## 📋 Requirements

- Node.js 16+
- MongoDB
- Redis (optional, but recommended for scheduling)
- Medium API credentials

## 🛠️ Installation

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/jignesh88/medium-mcp-api.git
   cd medium-mcp-api
   ```

2. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your credentials:
   ```
   MEDIUM_CLIENT_ID=your_medium_client_id
   MEDIUM_CLIENT_SECRET=your_medium_client_secret
   MEDIUM_REDIRECT_URI=http://your-domain.com/api/auth/medium/callback
   JWT_SECRET=your_strong_secret_key
   ```

4. Start the services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jignesh88/medium-mcp-api.git
   cd medium-mcp-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create and configure your `.env` file

4. Start MongoDB and Redis servers

5. Start the application:
   ```bash
   npm start
   ```

## 🔐 Medium API Setup

1. Create a Medium developer application at https://medium.com/me/applications
2. Set the callback URL to `http://your-domain.com/api/auth/medium/callback`
3. Copy your Client ID and Client Secret to your `.env` file

## 📚 API Documentation

### Authentication Endpoints

#### Register a new user

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "userId": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Login

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "userId": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "mediumConnected": true
  }
}
```

#### Connect Medium Account

```
GET /api/auth/medium
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "authUrl": "https://medium.com/m/oauth/authorize?client_id=..."
}
```