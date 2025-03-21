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

### Content Management Endpoints

#### Create a Post

```
POST /api/posts
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Request Body:**
```json
{
  "title": "My New Post",
  "content": "# Markdown Content\n\nThis is my post content.",
  "contentFormat": "markdown",
  "tags": ["programming", "tutorial"],
  "publishStatus": "draft",
  "publicationId": "optional_publication_id"
}
```

**Response:**
```json
{
  "_id": "post_id",
  "userId": "user_id",
  "title": "My New Post",
  "content": "# Markdown Content\n\nThis is my post content.",
  "contentFormat": "markdown",
  "tags": ["programming", "tutorial"],
  "publishStatus": "draft",
  "createdAt": "2025-03-16T07:00:00.000Z",
  "updatedAt": "2025-03-16T07:00:00.000Z"
}
```

#### Publish a Post to Medium

```
POST /api/posts/:postId/publish
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "message": "Post published successfully",
  "post": {
    "_id": "post_id",
    "mediumPostId": "medium_post_id",
    "title": "My New Post",
    "published": true,
    ...
  }
}
```

#### Get User's Posts

```
GET /api/posts?status=draft&page=1&limit=10
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "posts": [
    {
      "_id": "post_id",
      "title": "My New Post",
      ...
    }
  ],
  "total": 15,
  "page": 1,
  "pages": 2
}
```

### Media Management

#### Upload an Image

```
POST /api/media/upload
```

**Headers:**
```
Authorization: Bearer jwt_token_here
Content-Type: multipart/form-data
```

**Form Data:**
```
image: [file]
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "filePath": "/uploads/filename.jpg",
  "fileName": "filename.jpg",
  "originalName": "my-image.jpg",
  "mimeType": "image/jpeg",
  "size": 12345
}
```

## 🔄 Integrating with the MCP Server

### Example: Publishing a post with Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://your-domain.com';
const TOKEN = 'your_jwt_token';

async function publishPost() {
  try {
    // Create a draft post
    const post = await axios.post(`${API_URL}/api/posts`, {
      title: 'My Awesome Article',
      content: '# Hello Medium\n\nThis is my first post published via the MCP API.',
      contentFormat: 'markdown',
      tags: ['api', 'medium', 'tutorial'],
      publishStatus: 'draft'
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    // Publish the post to Medium
    const published = await axios.post(`${API_URL}/api/posts/${post.data._id}/publish`, {}, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log('Post published successfully!', published.data);
  } catch (error) {
    console.error('Error publishing post:', error.response?.data || error.message);
  }
}

publishPost();
```

## 📅 Scheduled Publishing

The server supports scheduling posts for future publication. When creating or updating a post, include a `scheduledAt` field with an ISO timestamp:

```json
{
  "title": "Scheduled Post",
  "content": "This will be published automatically.",
  "scheduledAt": "2025-03-20T12:00:00.000Z"
}
```

The server will automatically publish the post at the specified time if Redis is configured.

## 🛡️ Security Considerations

- Always use HTTPS in production
- Rotate your JWT secret regularly
- Set up proper monitoring and logging
- Store sensitive data in environment variables or a secure vault
- Implement proper CORS policies

## 🔧 Configuration

All configuration is done through environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 3000) | No |
| MONGODB_URI | MongoDB connection string | Yes |
| REDIS_URL | Redis connection string | No |
| JWT_SECRET | Secret for JWT tokens | Yes |
| MEDIUM_CLIENT_ID | Medium API client ID | Yes |
| MEDIUM_CLIENT_SECRET | Medium API client secret | Yes |
| MEDIUM_REDIRECT_URI | OAuth callback URL | Yes |
| FRONTEND_URL | URL for frontend redirects | Yes |

## 📜 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request