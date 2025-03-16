/**
 * Medium API MCP Server
 * A microservice for interacting with Medium's API to publish content and manage user accounts
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const morgan = require('morgan');
const redis = require('redis');
const { promisify } = require('util');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TurndownService = require('turndown');
const showdown = require('showdown');
const winston = require('winston');

// Initialize environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const MEDIUM_API_URL = 'https://api.medium.com/v1';

// Set up middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Set up rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

// Set up storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Set up Redis for caching and queue management
let redisClient;
let getAsync;
let setAsync;

if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });
  
  redisClient.on('error', (error) => {
    logger.error('Redis Error:', error);
  });
  
  getAsync = promisify(redisClient.get).bind(redisClient);
  setAsync = promisify(redisClient.set).bind(redisClient);
}

// Set up logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'medium-mcp' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medium-mcp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('Connected to MongoDB');
})
.catch((error) => {
  logger.error('MongoDB connection error:', error);
});

// Define schemas
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },
  mediumId: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  mediumPostId: { type: String },
  title: { type: String, required: true },
  content: { type: String, required: true },
  contentFormat: { type: String, enum: ['html', 'markdown'], default: 'markdown' },
  tags: [{ type: String }],
  canonicalUrl: { type: String },
  publishStatus: { type: String, enum: ['public', 'draft', 'unlisted'], default: 'draft' },
  license: { type: String },
  publicationId: { type: String },
  scheduledAt: { type: Date },
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Define models
const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);

// ============================
// Authentication Middleware
// ============================

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({ userId: decoded.userId });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if Medium token is expired and needs refresh
    if (user.tokenExpiry && new Date(user.tokenExpiry) < new Date()) {
      // Implement token refresh logic here if Medium API supports it
      logger.info(`Token expired for user ${user.userId}, attempting refresh`);
      
      // For now, just notify the user that re-authentication is needed
      return res.status(401).json({ error: 'Medium authorization expired, please reconnect your account' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ============================
// Helper Functions
// ============================

const formatForMedium = (content, contentFormat) => {
  if (contentFormat === 'markdown' && content) {
    // If content is in HTML but we need Markdown
    const turndownService = new TurndownService();
    return turndownService.turndown(content);
  } else if (contentFormat === 'html' && content) {
    // If content is in Markdown but we need HTML
    const converter = new showdown.Converter();
    return converter.makeHtml(content);
  }
  return content;
};