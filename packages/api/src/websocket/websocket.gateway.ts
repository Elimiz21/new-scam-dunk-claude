import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(WebsocketGateway.name);

  constructor(
    private jwtService: JwtService,
    private redis: RedisService,
  ) {
    // Subscribe to Redis events
    this.subscribeToRedisEvents();
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);

      this.logger.log(`Client ${client.id} connected for user ${payload.sub}`);
    } catch (error) {
      this.logger.error('WebSocket authentication failed', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join-scan')
  async handleJoinScan(client: Socket, scanId: string) {
    if (client.data.userId) {
      client.join(`scan:${scanId}`);
      this.logger.log(`User ${client.data.userId} joined scan ${scanId}`);
    }
  }

  @SubscribeMessage('leave-scan')
  async handleLeaveScan(client: Socket, scanId: string) {
    client.leave(`scan:${scanId}`);
    this.logger.log(`User ${client.data.userId} left scan ${scanId}`);
  }

  @SubscribeMessage('join-chat-import')
  async handleJoinChatImport(client: Socket, chatImportId: string) {
    if (client.data.userId) {
      client.join(`chat-import:${chatImportId}`);
      this.logger.log(`User ${client.data.userId} joined chat import ${chatImportId}`);
    }
  }

  @SubscribeMessage('leave-chat-import')
  async handleLeaveChatImport(client: Socket, chatImportId: string) {
    client.leave(`chat-import:${chatImportId}`);
    this.logger.log(`User ${client.data.userId} left chat import ${chatImportId}`);
  }

  // Send scan updates to clients
  async sendScanUpdate(scanId: string, update: any) {
    this.server.to(`scan:${scanId}`).emit('scan-update', update);
  }

  // Send notifications to user
  async sendNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  // Send chat import updates to clients
  async sendChatImportUpdate(chatImportId: string, update: any) {
    this.server.to(`chat-import:${chatImportId}`).emit('chat-import-update', update);
  }

  // Emit to specific user (used by chat import service)
  async emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  private async subscribeToRedisEvents() {
    await this.redis.sub('scan:created', (data) => {
      this.sendScanUpdate(data.scanId, { type: 'created', data });
    });

    await this.redis.sub('scan:progress', (data) => {
      this.sendScanUpdate(data.scanId, { type: 'progress', data });
    });

    await this.redis.sub('scan:completed', (data) => {
      this.sendScanUpdate(data.scanId, { type: 'completed', data });
    });

    await this.redis.sub('notification', (data) => {
      this.sendNotification(data.userId, data.notification);
    });

    await this.redis.sub('chat-import:status', (data) => {
      this.sendChatImportUpdate(data.chatImportId, { type: 'status', data });
    });

    await this.redis.sub('chat-import:progress', (data) => {
      this.sendChatImportUpdate(data.chatImportId, { type: 'progress', data });
    });

    await this.redis.sub('chat-import:completed', (data) => {
      this.sendChatImportUpdate(data.chatImportId, { type: 'completed', data });
    });
  }
}