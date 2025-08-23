import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

interface User {
  id: string;
  socketId: string;
  lastActivity: number;
}

class SignalingServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private connectedUsers: Map<string, User> = new Map();
  private allowedUserIds: Set<string>;
  private contactList: any[];

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.loadConfiguration();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  private loadConfiguration() {
    const allowedIds = process.env.ALLOWED_USER_IDS?.split(',') || [];
    this.allowedUserIds = new Set(allowedIds.map(id => id.trim()));

    try {
      this.contactList = JSON.parse(process.env.CONTACT_LIST_JSON || '[]');
    } catch (error) {
      this.contactList = [];
    }
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
    this.app.use(express.json());

    const globalRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
    });
    this.app.use(globalRateLimit);
  }

  private setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        connectedUsers: this.connectedUsers.size
      });
    });

    this.app.post('/api/auth/login', (req, res) => {
      const { userId, accessCode } = req.body;

      if (!this.allowedUserIds.has(userId)) {
        return res.status(403).json({ error: 'User not authorized' });
      }

      const token = jwt.sign({ userId }, process.env.JWT_SIGNING_KEY!, { expiresIn: '30m' });
      res.json({ token, expiresIn: 1800, userId });
    });

    this.app.get('/api/turn-credentials', this.authenticateJWT, (req, res) => {
      const userId = (req as any).userId;
      const credentials = this.generateTurnCredentials(userId);
      res.json(credentials);
    });
  }

  private authenticateJWT = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
      }

      const token = authHeader.substring(7);
      const payload = jwt.verify(token, process.env.JWT_SIGNING_KEY!) as JWTPayload;

      (req as any).userId = payload.userId;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  private setupSocketHandlers() {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const payload = jwt.verify(token, process.env.JWT_SIGNING_KEY!) as JWTPayload;
        (socket as any).userId = payload.userId;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = (socket as any).userId;

      this.connectedUsers.set(userId, {
        id: userId,
        socketId: socket.id,
        lastActivity: Date.now()
      });

      socket.on('offer', (data) => {
        socket.to(`user-${data.to}`).emit('offer', {
          from: userId,
          offer: data.offer,
          callId: data.callId
        });
      });

      socket.on('answer', (data) => {
        socket.to(`user-${data.to}`).emit('answer', {
          from: userId,
          answer: data.answer,
          callId: data.callId
        });
      });

      socket.on('ice-candidate', (data) => {
        socket.to(`user-${data.to}`).emit('ice-candidate', {
          from: userId,
          candidate: data.candidate,
          callId: data.callId
        });
      });

      socket.on('disconnect', () => {
        this.connectedUsers.delete(userId);
      });
    });
  }

  private generateTurnCredentials(userId: string) {
    const secret = process.env.TURN_AUTH_SECRET!;
    const ttl = parseInt(process.env.TURN_CRED_TTL || '3600');
    const timestamp = Math.floor(Date.now() / 1000) + ttl;

    const username = `${timestamp}:${userId}`;
    const credential = crypto.createHmac('sha1', secret).update(username).digest('base64');

    return {
      username,
      credential,
      ttl,
      uris: [
        `stun:${process.env.DOMAIN}:3478`,
        `turn:${process.env.DOMAIN}:3478?transport=udp`,
        `turn:${process.env.DOMAIN}:3478?transport=tcp`,
        `turns:${process.env.DOMAIN}:5349?transport=tcp`
      ]
    };
  }

  public start(port: number = 3000) {
    this.server.listen(port, () => {
      console.log(`Signaling server running on port ${port}`);
    });
  }
}

const server = new SignalingServer();
server.start(parseInt(process.env.PORT || '3000'));