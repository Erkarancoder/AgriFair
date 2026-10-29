import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentConversationId = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      // Re-join active conversation room if we reconnected
      if (this.currentConversationId) {
        this.joinConversation(this.currentConversationId);
      }
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection status:', err.message);
    });

    return this.socket;
  }

  joinConversation(conversationId) {
    if (!this.socket) {
      this.connect();
    }
    this.currentConversationId = conversationId;
    if (this.socket && conversationId) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  leaveConversation(conversationId) {
    if (this.socket && conversationId) {
      this.socket.emit('leave_conversation', conversationId);
    }
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
  }

  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentConversationId = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
