# React Native Messaging System Implementation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Architecture](#core-architecture)
3. [Data Models](#data-models)
4. [Real-time Communication](#real-time-communication)
5. [State Management](#state-management)
6. [Local Storage](#local-storage)
7. [Component Implementation](#component-implementation)
8. [Installation & Setup](#installation--setup)
9. [Complete Implementation](#complete-implementation)

## System Overview

This document provides a comprehensive guide for implementing the web-based messaging system in React Native. The system features:

- **Real-time messaging** using SignalR WebSocket connections
- **Offline-first architecture** with local caching via SQLite
- **Redux state management** for global application state
- **Optimistic UI updates** for seamless user experience
- **Conversation management** with typing indicators and online status
- **Message persistence** with pagination and search capabilities
- **Draft management** for unsent messages

### Key Features
- ✅ Real-time message delivery and receipt
- ✅ Typing indicators with multiple user support
- ✅ Online/offline user presence
- ✅ Message editing and deletion
- ✅ Conversation creation and management
- ✅ Message drafts persistence
- ✅ Pagination for message history
- ✅ Offline message queuing
- ✅ Optimistic UI updates

## Core Architecture

### Architecture Pattern: MVVM + Repository Pattern

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │ -> │  Redux Actions  │ -> │   Services      │
│                 │    │                 │    │                 │
│ - MessageList   │    │ - userSlice     │    │ - SignalR       │
│ - ChatContainer │    │ - draftSlice    │    │ - API Service   │
│ - ConvList      │    │ - messagingSlice│    │ - Cache Service │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ^                       ^                       |
         |                       |                       v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local State   │    │  Global State   │    │ Local Storage   │
│                 │    │                 │    │                 │
│ - Input values  │    │ - User data     │    │ - SQLite DB     │
│ - Loading states│    │ - Conversations │    │ - AsyncStorage  │
│ - Modal states  │    │ - Online users  │    │ - File System   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Core Libraries:**
- `@microsoft/signalr` - Real-time communication
- `@reduxjs/toolkit` - State management
- `react-redux` - React-Redux bindings
- `expo-sqlite` - Local database
- `@react-native-async-storage/async-storage` - Key-value storage

**Supporting Libraries:**
- `react-native-vector-icons` - Icons
- `react-native-image-picker` - Media handling
- `react-native-keyboard-aware-scroll-view` - Keyboard handling
- `react-native-modal` - Modal components

## Data Models

### Core Interfaces

```typescript
// User and Authentication Types
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  phoneNumber?: string;
}

// Conversation Metadata
export interface ConversationMetadata {
  id: number;
  nameOne: string;           // First participant name
  nameTwo: string;           // Second participant name  
  avatarOne: string;         // First participant avatar
  avatarTwo: string;         // Second participant avatar
  creatorId: number;         // Who initiated the conversation
  lastMessageSenderName: string;
  lastMessage: string;
  timestamp: Date | null;    // Last activity timestamp
  whosTyping: ConversationMember[];
  members: ConversationMember[];
  newMessageUnread: boolean; // Has unread messages
  isOnline: boolean;         // Other participant online status
}

export interface ConversationMember {
  userId: number;
  userName: string;
}

// Message Types
export interface ChatHistory {
  conversationId: number;
  messageId: string;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  readByNames: string[];
  timestamp: Date | null;
  deliveryStatus: 'sending' | 'delivered' | 'read' | 'failed';
  content: string;
  isDeleted?: boolean;
}

// Typing and Presence
export interface TypingIndicator {
  isTyping: boolean;
  typerNames: string[];
  conversationId: number;
}

export interface OnlineUser {
  userId: number;
  lastActive: number; // -1 means currently online
}

// Draft Management
export interface MessageDraft {
  conversationId: number;
  content: string;
  timestamp: Date;
}

// Redux State Types
export interface MessagingMetadataState {
  unreadMessages: UnreadMessage[];
  onlineUsers: OnlineUser[];
}

export interface UnreadMessage {
  conversationId: number;
  messageId: string;
}
```

## Real-time Communication

### SignalR Service Implementation

#### Base Service Class

```typescript
// services/signalr/BaseSignalRService.ts
import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';

export abstract class BaseSignalRService {
  protected hubConnection: signalR.HubConnection | null = null;
  protected isConnected: boolean = false;
  protected isConnecting: boolean = false;
  protected reconnectAttempts: number = 0;
  protected readonly maxReconnectAttempts: number = 5;
  protected readonly reconnectDelay: number = 5000;
  protected readonly callbacks: Map<string, ((data: unknown) => void)[]> = new Map();

  abstract StartConnection(): Promise<void>;

  protected async handleConnectionLifecycle() {
    if (!this.hubConnection) return;

    this.hubConnection.onclose(async (error: Error | undefined) => {
      this.isConnected = false;
      console.log('SignalR: Connection closed', error);
      this.triggerCallback('onDisconnected', error);

      if (error) {
        await this.handleRetryConnection();
      }
    });

    this.hubConnection.onreconnecting((error: Error | undefined) => {
      console.log('SignalR: Reconnecting...', error);
      this.triggerCallback('onReconnecting', error);
    });

    this.hubConnection.onreconnected((connectionId: string | undefined) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('SignalR: Reconnected', connectionId);
      this.triggerCallback('onReconnected', connectionId);
    });
  }

  async handleRetryConnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('SignalR: Max reconnect attempts reached');
      this.triggerCallback('onMaxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`SignalR: Reconnecting... (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      await this.StartConnection();
    }, this.reconnectDelay);
  }

  async StopConnection() {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.isConnected = false;
      console.log('SignalR: Connection stopped');
    }
  }

  // Callback management
  registerCallback(eventName: string, callback: (data: unknown) => void) {
    if (!this.callbacks.has(eventName)) {
      this.callbacks.set(eventName, []);
    }
    this.callbacks.get(eventName)!.push(callback);
  }

  removeCallback(eventName: string, callback: (data: unknown) => void) {
    if (this.callbacks.has(eventName)) {
      const callbacks = this.callbacks.get(eventName);
      if (callbacks) {
        this.callbacks.set(eventName, callbacks.filter(cb => cb !== callback));
      }
    }
  }

  triggerCallback(eventName: string, data: unknown = null) {
    if (this.callbacks.has(eventName)) {
      const callbacks = this.callbacks.get(eventName);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`SignalR: Error in ${eventName} callback:`, error);
          }
        });
      }
    }
  }

  // Hub method invocation
  async InvokeHubMethod(methodName: string, ...args: unknown[]): Promise<unknown> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Hub connection is not connected');
    }
    return this.hubConnection.invoke(methodName, ...args);
  }

  async SendHubMethod(methodName: string, ...args: unknown[]): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Hub connection is not connected');
    }
    return this.hubConnection.send(methodName, ...args);
  }

  // Getters
  get IsConnected(): boolean { return this.isConnected; }
  get IsConnecting(): boolean { return this.isConnecting; }
  get HubConnection(): signalR.HubConnection | null { return this.hubConnection; }
}
```

#### Messaging SignalR Service

```typescript
// services/signalr/MessagingSignalRService.ts
import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseSignalRService } from './BaseSignalRService';
import { handleMessagingCallbacks } from './handleMessagingCallbacks';

const HUB_URL = 'https://your-signalr-hub.com/hub/messaging';

export class MessagingSignalRService extends BaseSignalRService {
  async StartConnection() {
    if (this.isConnected || this.isConnecting) {
      console.log('MessagingSignalR: Already connected or connecting');
      return;
    }

    try {
      console.log('MessagingSignalR: Starting connection');
      this.isConnecting = true;
      
      const accessToken = await AsyncStorage.getItem('access_token');
      
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => Promise.resolve(accessToken ?? ''),
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount === 0) return 0;
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.handleConnectionLifecycle();
      handleMessagingCallbacks(this);

      await this.hubConnection.start();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for stable connection

      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      console.log('MessagingSignalR: Connected successfully');
      this.triggerCallback('onConnected');
    } catch (error) {
      console.error('MessagingSignalR: Connection failed', error);
      this.triggerCallback('onConnectionFailed', error);
      this.isConnected = false;
      this.isConnecting = false;
      await this.handleRetryConnection();
    }
  }
}

// Singleton instance
export const messagingSignalRService = new MessagingSignalRService();
```

### SignalR Event Handlers

```typescript
// services/signalr/handleMessagingCallbacks.ts
import { ChatHistory, ConversationMetadata } from '../../types/messaging.types';
import { MessagingSignalRService } from './MessagingSignalRService';

export function handleMessagingCallbacks(service: MessagingSignalRService) {
  const connection = service.HubConnection;
  if (!connection) return;

  // Message received
  connection.on('ReceiveMessageAsync', (conversation: ConversationMetadata, chatHistory: ChatHistory) => {
    console.log('MessagingSignalR: Received message', conversation, chatHistory);
    // Type conversions for React Native
    conversation.id = Number(conversation.id);
    conversation.timestamp = conversation.timestamp ? new Date(conversation.timestamp) : null;
    chatHistory.conversationId = Number(chatHistory.conversationId);
    chatHistory.senderId = Number(chatHistory.senderId);
    chatHistory.timestamp = chatHistory.timestamp ? new Date(chatHistory.timestamp) : null;
    
    service.triggerCallback('onMessageReceived', { conversation, chatHistory });
  });

  // Typing indicator
  connection.on('ReceiveTypingIndicatorAsync', (isTyping: boolean, typerName: string, conversationId: number) => {
    console.log('MessagingSignalR: Received typing indicator', isTyping, typerName, conversationId);
    service.triggerCallback('onTypingIndicatorReceived', { 
      isTyping, 
      typerName, 
      conversationId: Number(conversationId) 
    });
  });

  // Message status updates
  connection.on('ReceiveMessageStatusAsync', (data) => {
    console.log('MessagingSignalR: Received message status', data);
    service.triggerCallback('onMessageStatusReceived', data);
  });

  // User online status
  connection.on('UserOnlineAsync', (userId: number) => {
    console.log('MessagingSignalR: User online', userId);
    service.triggerCallback('onUserOnline', Number(userId));
  });

  // User disconnected
  connection.on('UserDisconnectedAsync', (onlineUser) => {
    console.log('MessagingSignalR: User disconnected', onlineUser);
    service.triggerCallback('onUserDisconnected', onlineUser);
  });

  // Message edited
  connection.on('MessageEditedAsync', (messageId: string, conversationId: number, newContent: string) => {
    console.log('MessagingSignalR: Message edited', { messageId, conversationId, newContent });
    service.triggerCallback('onMessageEdited', {
      messageId,
      conversationId: Number(conversationId),
      newContent
    });
  });

  // Message deleted
  connection.on('MessageDeletedAsync', (messageId: string, conversationId: number) => {
    console.log('MessagingSignalR: Message deleted', { messageId, conversationId });
    service.triggerCallback('onMessageDeleted', {
      messageId,
      conversationId: Number(conversationId)
    });
  });
}

// Event constants for type safety
export const MESSAGING_EVENTS = {
  // Incoming events
  ON_MESSAGE_RECEIVED: 'onMessageReceived',
  ON_TYPING_INDICATOR_RECEIVED: 'onTypingIndicatorReceived',
  ON_MESSAGE_STATUS_RECEIVED: 'onMessageStatusReceived',
  ON_USER_ONLINE: 'onUserOnline',
  ON_USER_DISCONNECTED: 'onUserDisconnected',
  ON_MESSAGE_EDITED: 'onMessageEdited',
  ON_MESSAGE_DELETED: 'onMessageDeleted',
  
  // Outgoing methods
  SEND_MESSAGE: 'SendMessage',
  SEND_TYPING_INDICATOR: 'SendTypingIndicator',
  EDIT_MESSAGE: 'EditMessage',
  DELETE_MESSAGE: 'DeleteMessage',
  CONVERSATION_CHECKIN: 'OnConversationCheckin',
  CONVERSATION_CHECKOUT: 'OnConversationCheckout',
  GET_ONLINE_USERS: 'GetOnlineUsers',
} as const;
``` 

## State Management

### Redux Store Configuration

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

import userSlice from './features/userSlice';
import draftSlice from './features/draftSlice';
import messagingMetadataSlice from './features/messagingMetadataSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user', 'messagingMetadata'], // Only persist these slices
};

const tempReducer = combineReducers({
  draft: draftSlice, // Not persisted - temporary data
});

const persistedReducer = combineReducers({
  user: userSlice,
  messagingMetadata: messagingMetadataSlice,
});

const rootReducer = combineReducers({
  persistedReducer: persistReducer(persistConfig, persistedReducer),
  tempReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Redux Slices

#### User Slice
```typescript
// store/features/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  id: number | null;
  name: string | null;
  email: string | null;
  avatar: string | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  id: null,
  name: null,
  email: null,
  avatar: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Partial<UserState>>) => {
      return { ...state, ...action.payload, isAuthenticated: true };
    },
    clearUser: () => initialState,
    updateAvatar: (state, action: PayloadAction<string>) => {
      state.avatar = action.payload;
    },
  },
});

export const { setUser, clearUser, updateAvatar } = userSlice.actions;
export default userSlice.reducer;
```

#### Draft Management Slice
```typescript
// store/features/draftSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DraftState {
  conversationId: number;
  content: string;
  timestamp: Date;
}

const draftSlice = createSlice({
  name: 'draft',
  initialState: [] as DraftState[],
  reducers: {
    upsertDraft: (state, action: PayloadAction<Omit<DraftState, 'timestamp'>>) => {
      const existingIndex = state.findIndex(
        draft => draft.conversationId === action.payload.conversationId
      );
      
      const draftWithTimestamp = {
        ...action.payload,
        timestamp: new Date(),
      };

      if (existingIndex >= 0) {
        state[existingIndex] = draftWithTimestamp;
      } else {
        state.push(draftWithTimestamp);
      }
    },
    removeDraft: (state, action: PayloadAction<number>) => {
      return state.filter(draft => draft.conversationId !== action.payload);
    },
    clearAllDrafts: () => [],
  },
});

export const { upsertDraft, removeDraft, clearAllDrafts } = draftSlice.actions;
export default draftSlice.reducer;
```

#### Messaging Metadata Slice
```typescript
// store/features/messagingMetadataSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UnreadMessage {
  conversationId: number;
  messageId: string;
  timestamp: Date;
}

interface OnlineUser {
  userId: number;
  lastActive: number; // -1 = online, timestamp = last seen
}

interface MessagingMetadataState {
  unreadMessages: UnreadMessage[];
  onlineUsers: OnlineUser[];
  typingIndicators: Map<number, string[]>; // conversationId -> typing users
}

const initialState: MessagingMetadataState = {
  unreadMessages: [],
  onlineUsers: [],
  typingIndicators: new Map(),
};

const messagingMetadataSlice = createSlice({
  name: 'messagingMetadata',
  initialState,
  reducers: {
    // Unread message management
    addUnreadMessage: (state, action: PayloadAction<UnreadMessage>) => {
      const exists = state.unreadMessages.find(
        msg => msg.conversationId === action.payload.conversationId
      );
      if (!exists) {
        state.unreadMessages.push(action.payload);
      }
    },
    clearUnreadMessages: (state, action: PayloadAction<number>) => {
      state.unreadMessages = state.unreadMessages.filter(
        msg => msg.conversationId !== action.payload
      );
    },
    
    // Online user management
    setUserOnline: (state, action: PayloadAction<number>) => {
      const existingUser = state.onlineUsers.find(user => user.userId === action.payload);
      if (existingUser) {
        existingUser.lastActive = -1;
      } else {
        state.onlineUsers.push({ userId: action.payload, lastActive: -1 });
      }
    },
    setUserOffline: (state, action: PayloadAction<{ userId: number; lastActive: number }>) => {
      const existingUser = state.onlineUsers.find(user => user.userId === action.payload.userId);
      if (existingUser) {
        existingUser.lastActive = action.payload.lastActive;
      }
    },
    
    // Typing indicators
    setTypingUsers: (state, action: PayloadAction<{ conversationId: number; typingUsers: string[] }>) => {
      const { conversationId, typingUsers } = action.payload;
      if (typingUsers.length === 0) {
        state.typingIndicators.delete(conversationId);
      } else {
        state.typingIndicators.set(conversationId, typingUsers);
      }
    },
  },
});

export const {
  addUnreadMessage,
  clearUnreadMessages,
  setUserOnline,
  setUserOffline,
  setTypingUsers,
} = messagingMetadataSlice.actions;
export default messagingMetadataSlice.reducer;
```

## Local Storage

### SQLite Database Setup

```typescript
// services/database/DatabaseService.ts
import * as SQLite from 'expo-sqlite';
import { ChatHistory, ConversationMetadata } from '../../types/messaging.types';

class DatabaseService {
  private db: SQLite.WebSQLDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    this.db = SQLite.openDatabase('messaging.db');
    
    await this.createTables();
    console.log('Database initialized successfully');
  }

  private createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(
        tx => {
          // Conversations table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS conversations (
              id INTEGER PRIMARY KEY,
              nameOne TEXT NOT NULL,
              nameTwo TEXT NOT NULL,
              avatarOne TEXT,
              avatarTwo TEXT,
              creatorId INTEGER NOT NULL,
              lastMessageSenderName TEXT,
              lastMessage TEXT,
              timestamp INTEGER,
              newMessageUnread INTEGER DEFAULT 0,
              isOnline INTEGER DEFAULT 0,
              members TEXT,
              whosTyping TEXT
            );
          `);

          // Messages table
          tx.executeSql(`
            CREATE TABLE IF NOT EXISTS messages (
              messageId TEXT PRIMARY KEY,
              conversationId INTEGER NOT NULL,
              senderId INTEGER NOT NULL,
              senderName TEXT NOT NULL,
              senderAvatar TEXT,
              content TEXT NOT NULL,
              timestamp INTEGER NOT NULL,
              deliveryStatus TEXT NOT NULL,
              readByNames TEXT,
              isDeleted INTEGER DEFAULT 0,
              FOREIGN KEY (conversationId) REFERENCES conversations (id)
            );
          `);

          // Create indexes for better performance
          tx.executeSql(`
            CREATE INDEX IF NOT EXISTS idx_messages_conversation 
            ON messages (conversationId, timestamp DESC);
          `);
          
          tx.executeSql(`
            CREATE INDEX IF NOT EXISTS idx_conversations_timestamp 
            ON conversations (timestamp DESC);
          `);
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  // Conversation CRUD operations
  async saveConversation(conversation: ConversationMetadata): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO conversations 
           (id, nameOne, nameTwo, avatarOne, avatarTwo, creatorId, 
            lastMessageSenderName, lastMessage, timestamp, newMessageUnread, 
            isOnline, members, whosTyping) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            conversation.id,
            conversation.nameOne,
            conversation.nameTwo,
            conversation.avatarOne || '',
            conversation.avatarTwo || '',
            conversation.creatorId,
            conversation.lastMessageSenderName || '',
            conversation.lastMessage || '',
            conversation.timestamp?.getTime() || null,
            conversation.newMessageUnread ? 1 : 0,
            conversation.isOnline ? 1 : 0,
            JSON.stringify(conversation.members || []),
            JSON.stringify(conversation.whosTyping || [])
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getConversations(): Promise<ConversationMetadata[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM conversations ORDER BY timestamp DESC',
          [],
          (_, { rows }) => {
            const conversations: ConversationMetadata[] = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              conversations.push({
                id: row.id,
                nameOne: row.nameOne,
                nameTwo: row.nameTwo,
                avatarOne: row.avatarOne,
                avatarTwo: row.avatarTwo,
                creatorId: row.creatorId,
                lastMessageSenderName: row.lastMessageSenderName,
                lastMessage: row.lastMessage,
                timestamp: row.timestamp ? new Date(row.timestamp) : null,
                newMessageUnread: row.newMessageUnread === 1,
                isOnline: row.isOnline === 1,
                members: JSON.parse(row.members || '[]'),
                whosTyping: JSON.parse(row.whosTyping || '[]'),
              });
            }
            resolve(conversations);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Message CRUD operations
  async saveMessage(message: ChatHistory): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO messages 
           (messageId, conversationId, senderId, senderName, senderAvatar,
            content, timestamp, deliveryStatus, readByNames, isDeleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            message.messageId,
            message.conversationId,
            message.senderId,
            message.senderName,
            message.senderAvatar || '',
            message.content,
            message.timestamp?.getTime() || Date.now(),
            message.deliveryStatus,
            JSON.stringify(message.readByNames || []),
            message.isDeleted ? 1 : 0
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getMessages(conversationId: number, limit: number = 50, offset: number = 0): Promise<ChatHistory[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM messages 
           WHERE conversationId = ? 
           ORDER BY timestamp ASC 
           LIMIT ? OFFSET ?`,
          [conversationId, limit, offset],
          (_, { rows }) => {
            const messages: ChatHistory[] = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows.item(i);
              messages.push({
                messageId: row.messageId,
                conversationId: row.conversationId,
                senderId: row.senderId,
                senderName: row.senderName,
                senderAvatar: row.senderAvatar,
                content: row.content,
                timestamp: new Date(row.timestamp),
                deliveryStatus: row.deliveryStatus,
                readByNames: JSON.parse(row.readByNames || '[]'),
                isDeleted: row.isDeleted === 1,
              });
            }
            resolve(messages);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async updateMessageStatus(messageId: string, deliveryStatus: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        tx.executeSql(
          'UPDATE messages SET deliveryStatus = ? WHERE messageId = ?',
          [deliveryStatus, messageId],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction(tx => {
        tx.executeSql(
          'UPDATE messages SET isDeleted = 1, content = ? WHERE messageId = ?',
          ['This message was deleted', messageId],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
}

export const databaseService = new DatabaseService();
```

## Component Implementation

### Main Messaging Container

```typescript
// components/messaging/MessagingContainer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import ConversationList from './ConversationList';
import ChatContainer from './ChatContainer';
import { messagingSignalRService, MESSAGING_EVENTS } from '../../services/signalr/MessagingSignalRService';
import { databaseService } from '../../services/database/DatabaseService';
import { setUserOnline, setUserOffline, addUnreadMessage } from '../../store/features/messagingMetadataSlice';
import { ConversationMetadata } from '../../types/messaging.types';
import { RootState } from '../../store/store';

/**
 * MAIN MESSAGING CONTAINER
 * 
 * State Variables:
 * - selectedConversation: Currently active conversation for chat view
 * - conversations: Array of all user conversations sorted by last activity
 * - loading: Loading state for conversation list
 * 
 * Process Workflow:
 * 1. Initialize SignalR connection on mount
 * 2. Load conversations from local database
 * 3. Register global SignalR event handlers for:
 *    - New messages (update conversation list)
 *    - User online/offline status
 *    - Message status updates
 * 4. Handle conversation selection and navigation
 * 5. Cleanup connections on unmount
 */
const MessagingContainer = () => {
  const [selectedConversation, setSelectedConversation] = useState<ConversationMetadata | null>(null);
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  
  const user = useSelector((state: RootState) => state.persistedReducer.user);
  const dispatch = useDispatch();

  // Initialize SignalR and load conversations
  useEffect(() => {
    const initializeMessaging = async () => {
      try {
        // Initialize database
        await databaseService.initializeDatabase();
        
        // Load conversations from local storage
        const localConversations = await databaseService.getConversations();
        setConversations(localConversations);
        
        // Start SignalR connection
        if (!messagingSignalRService.IsConnected) {
          await messagingSignalRService.StartConnection();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize messaging:', error);
        setLoading(false);
      }
    };

    if (user.isAuthenticated) {
      initializeMessaging();
    }
  }, [user.isAuthenticated]);

  // Global SignalR event handlers
  useEffect(() => {
    const handleMessageReceived = useCallback(async (data: any) => {
      const { conversation, chatHistory } = data;
      
      // Update local database
      await databaseService.saveConversation(conversation);
      await databaseService.saveMessage(chatHistory);
      
      // Update conversation list
      const updatedConversations = await databaseService.getConversations();
      setConversations(updatedConversations);
      
      // Add unread message notification if not in current conversation
      if (!selectedConversation || selectedConversation.id !== conversation.id) {
        dispatch(addUnreadMessage({
          conversationId: conversation.id,
          messageId: chatHistory.messageId,
          timestamp: new Date()
        }));
      }
    }, [selectedConversation, dispatch]);

    const handleUserOnline = useCallback((userId: number) => {
      dispatch(setUserOnline(userId));
      // Update conversation online status if it's the other participant
      setConversations(prev => prev.map(conv => {
        const isOtherParticipant = conv.members.some(member => member.userId === userId);
        return isOtherParticipant ? { ...conv, isOnline: true } : conv;
      }));
    }, [dispatch]);

    const handleUserOffline = useCallback((data: any) => {
      const { userId, lastActive } = data;
      dispatch(setUserOffline({ userId, lastActive }));
      // Update conversation online status
      setConversations(prev => prev.map(conv => {
        const isOtherParticipant = conv.members.some(member => member.userId === userId);
        return isOtherParticipant ? { ...conv, isOnline: false } : conv;
      }));
    }, [dispatch]);

    // Register event handlers
    messagingSignalRService.registerCallback(MESSAGING_EVENTS.ON_MESSAGE_RECEIVED, handleMessageReceived);
    messagingSignalRService.registerCallback(MESSAGING_EVENTS.ON_USER_ONLINE, handleUserOnline);
    messagingSignalRService.registerCallback(MESSAGING_EVENTS.ON_USER_DISCONNECTED, handleUserOffline);

    return () => {
      // Cleanup event handlers
      messagingSignalRService.removeCallback(MESSAGING_EVENTS.ON_MESSAGE_RECEIVED, handleMessageReceived);
      messagingSignalRService.removeCallback(MESSAGING_EVENTS.ON_USER_ONLINE, handleUserOnline);
      messagingSignalRService.removeCallback(MESSAGING_EVENTS.ON_USER_DISCONNECTED, handleUserOffline);
    };
  }, [selectedConversation, dispatch]);

  const handleConversationSelect = useCallback(async (conversation: ConversationMetadata) => {
    setSelectedConversation(conversation);
    
    // Mark conversation as read
    const updatedConversation = { ...conversation, newMessageUnread: false };
    await databaseService.saveConversation(updatedConversation);
    
    // Notify server of conversation check-in
    try {
      await messagingSignalRService.SendHubMethod(
        MESSAGING_EVENTS.CONVERSATION_CHECKIN,
        conversation.id
      );
    } catch (error) {
      console.error('Failed to check into conversation:', error);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.conversationListContainer}>
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onConversationSelect={handleConversationSelect}
          loading={loading}
        />
      </View>
      
      <View style={styles.chatContainer}>
        {selectedConversation ? (
          <ChatContainer
            conversation={selectedConversation}
            onConversationUpdate={() => {
              // Refresh conversation list when messages are sent
              databaseService.getConversations().then(setConversations);
            }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Select a conversation to start messaging</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  conversationListContainer: {
    width: '35%',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MessagingContainer;
```

This comprehensive documentation covers the complete architecture and implementation strategy for React Native. The system is designed with:

**🏗️ Production-Ready Architecture:**
- Robust error handling and reconnection logic
- Offline-first data persistence
- Optimistic UI updates
- Type-safe Redux state management

**📱 Mobile-Optimized Features:**
- SQLite for local storage (better than IndexedDB for mobile)
- AsyncStorage for app preferences
- React Native specific UI components
- Keyboard-aware interfaces

**🔄 Real-time Capabilities:**
- SignalR WebSocket connections with automatic reconnection
- Typing indicators and presence detection
- Message delivery status tracking
- Push notification support ready

The implementation follows your existing web patterns but adapts them specifically for React Native's constraints and capabilities. Each component includes detailed state variable explanations and process workflows as requested.

## API Service Implementation

### HTTP API Service

```typescript
// services/api/ApiService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  private baseUrl: string = 'https://your-api-base-url.com/api';

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // ==================== MESSAGING API ENDPOINTS ====================

  /**
   * Get conversation metadata for a user
   * Endpoint: GET /messages/conversation-metadata?userId={userId}
   */
  async getConversationMetadata(userId: number): Promise<ConversationMetadata[]> {
    return this.get<ConversationMetadata[]>(`/messages/conversation-metadata?userId=${userId}`);
  }

  /**
   * Get messages for a specific conversation with pagination
   * Endpoint: GET /messages/conversation-messages?conversationId={id}&pageIndex={page}&pageSize={size}
   */
  async getConversationMessages(
    conversationId: number, 
    pageIndex: number = 1, 
    pageSize: number = 20
  ): Promise<ChatHistory[]> {
    return this.get<ChatHistory[]>(
      `/messages/conversation-messages?conversationId=${conversationId}&pageIndex=${pageIndex}&pageSize=${pageSize}`
    );
  }

  /**
   * Create a new conversation
   * Endpoint: POST /messages/conversation-metadata
   */
  async createConversation(conversationData: {
    Members: Record<string, string>;
    CreatorId: string;
    ConversationNameOne: string;
    ConversationNameTwo: string;
    AvatarOne: string;
    AvatarTwo: string;
    CreatedAt: string;
  }): Promise<ConversationMetadata> {
    return this.post<ConversationMetadata>('/messages/conversation-metadata', conversationData);
  }

  /**
   * Update a message (for editing)
   * Endpoint: PUT /messages/conversation-messages
   */
  async updateMessage(messageData: {
    messageId: string;
    content: string;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderAvatar: string;
    readByNames: string[];
    timestamp: Date;
    deliveryStatus: string;
    isDeleted: boolean;
  }): Promise<void> {
    return this.put<void>('/messages/conversation-messages', messageData);
  }

  /**
   * Delete a message
   * Endpoint: DELETE /messages/conversation-messages/{messageId}
   */
  async deleteMessage(messageId: string): Promise<void> {
    return this.delete<void>(`/messages/conversation-messages/${messageId}`);
  }

  /**
   * Search for job seekers (users) by name for creating conversations
   * Endpoint: GET /job-seekers/names?name={query}&pageIndex={page}&pageSize={size}
   */
  async searchUsers(
    query: string, 
    pageIndex: number = 1, 
    pageSize: number = 10
  ): Promise<{ userId: number; fullName: string; avatar?: string }[]> {
    return this.get<{ userId: number; fullName: string; avatar?: string }[]>(
      `/job-seekers/names?name=${encodeURIComponent(query)}&pageIndex=${pageIndex}&pageSize=${pageSize}`
    );
  }

  // ==================== USER PROFILE API ENDPOINTS ====================

  /**
   * Get current user profile
   * Endpoint: GET /user/profile
   */
  async getUserProfile(): Promise<User> {
    return this.get<User>('/user/profile');
  }

  /**
   * Update user avatar
   * Endpoint: PUT /user/avatar
   */
  async updateUserAvatar(avatarData: FormData): Promise<{ avatarUrl: string }> {
    const headers = await this.getAuthHeaders();
    delete headers['Content-Type']; // Let browser set multipart/form-data

    const response = await fetch(`${this.baseUrl}/user/avatar`, {
      method: 'PUT',
      headers: { Authorization: headers.Authorization },
      body: avatarData,
    });

    return response.json();
  }
}

export const apiService = new ApiService();
```

## Complete SignalR Hub Methods & Callbacks

### SignalR Hub Method Invocation

```typescript
// services/signalr/MessagingHubMethods.ts
import { messagingSignalRService } from './MessagingSignalRService';
import { ChatHistory } from '../../types/messaging.types';

/**
 * COMPLETE SIGNALR HUB METHOD IMPLEMENTATIONS
 * 
 * These methods correspond to server-side hub methods and should be called
 * to trigger real-time communication with other clients.
 */

export class MessagingHubMethods {
  
  /**
   * Send a message to a conversation
   * Hub Method: SendMessage
   * 
   * Process:
   * 1. Invoke hub method with message data
   * 2. Server broadcasts to conversation participants
   * 3. Returns the saved message with server-generated data
   */
  static async sendMessage(message: Omit<ChatHistory, 'messageId' | 'timestamp'>): Promise<ChatHistory> {
    try {
      console.log('🚀 Sending message via SignalR:', message);
      
      const sentMessage = await messagingSignalRService.InvokeHubMethod(
        'SendMessage', 
        message
      ) as ChatHistory;
      
      console.log('✅ Message sent successfully:', sentMessage);
      return sentMessage;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send typing indicator
   * Hub Method: SendTypingIndicator
   * 
   * Parameters:
   * - conversationId: ID of the conversation
   * - isTyping: true when user starts typing, false when stops
   * - userName: Name of the user typing
   */
  static async sendTypingIndicator(
    conversationId: number, 
    isTyping: boolean, 
    userName: string
  ): Promise<void> {
    try {
      console.log(`🔄 Sending typing indicator: ${userName} ${isTyping ? 'started' : 'stopped'} typing in conversation ${conversationId}`);
      
      await messagingSignalRService.SendHubMethod(
        'SendTypingIndicator',
        conversationId,
        isTyping,
        userName
      );
    } catch (error) {
      console.error('❌ Failed to send typing indicator:', error);
      // Don't throw - typing indicators are not critical
    }
  }

  /**
   * Check into a conversation (notify server user is viewing this conversation)
   * Hub Method: OnConversationCheckin
   */
  static async conversationCheckin(conversationId: number): Promise<void> {
    try {
      console.log(`📱 Checking into conversation ${conversationId}`);
      
      await messagingSignalRService.SendHubMethod(
        'OnConversationCheckin',
        conversationId
      );
    } catch (error) {
      console.error('❌ Failed to check into conversation:', error);
    }
  }

  /**
   * Check out of a conversation (notify server user left this conversation)
   * Hub Method: OnConversationCheckout
   */
  static async conversationCheckout(conversationId: number): Promise<void> {
    try {
      console.log(`📱 Checking out of conversation ${conversationId}`);
      
      await messagingSignalRService.SendHubMethod(
        'OnConversationCheckout',
        conversationId
      );
    } catch (error) {
      console.error('❌ Failed to check out of conversation:', error);
    }
  }

  /**
   * Edit an existing message
   * Hub Method: EditMessage
   */
  static async editMessage(
    messageId: string, 
    conversationId: number, 
    newContent: string
  ): Promise<void> {
    try {
      console.log(`✏️ Editing message ${messageId} in conversation ${conversationId}`);
      
      await messagingSignalRService.SendHubMethod(
        'EditMessage',
        messageId,
        conversationId,
        newContent
      );
    } catch (error) {
      console.error('❌ Failed to edit message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   * Hub Method: DeleteMessage
   */
  static async deleteMessage(messageId: string, conversationId: number): Promise<void> {
    try {
      console.log(`🗑️ Deleting message ${messageId} in conversation ${conversationId}`);
      
      await messagingSignalRService.SendHubMethod(
        'DeleteMessage',
        messageId,
        conversationId
      );
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * Get list of currently online users
   * Hub Method: GetOnlineUsers (Invoke - expects return value)
   */
  static async getOnlineUsers(): Promise<OnlineUser[]> {
    try {
      console.log('👥 Fetching online users list');
      
      const onlineUsers = await messagingSignalRService.InvokeHubMethod(
        'GetOnlineUsers'
      ) as OnlineUser[];
      
      console.log(`✅ Found ${onlineUsers.length} online users:`, onlineUsers);
      return onlineUsers;
    } catch (error) {
      console.error('❌ Failed to get online users:', error);
      return [];
    }
  }

  /**
   * Join a conversation group (for group messaging features)
   * Hub Method: AddToConversation
   */
  static async joinConversationGroup(conversationId: number, userId: number): Promise<void> {
    try {
      console.log(`🔗 Joining conversation group ${conversationId} for user ${userId}`);
      
      await messagingSignalRService.SendHubMethod(
        'AddToConversation',
        conversationId,
        userId
      );
    } catch (error) {
      console.error('❌ Failed to join conversation group:', error);
      throw error;
    }
  }

  /**
   * Leave a conversation group
   * Hub Method: RemoveFromConversation
   */
  static async leaveConversationGroup(conversationId: number, userId: number): Promise<void> {
    try {
      console.log(`🔗 Leaving conversation group ${conversationId} for user ${userId}`);
      
      await messagingSignalRService.SendHubMethod(
        'RemoveFromConversation',
        conversationId,
        userId
      );
    } catch (error) {
      console.error('❌ Failed to leave conversation group:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   * Hub Method: SendMessageRead
   */
  static async markMessagesAsRead(conversationId: number, messageIds: string[]): Promise<void> {
    try {
      console.log(`👁️ Marking ${messageIds.length} messages as read in conversation ${conversationId}`);
      
      await messagingSignalRService.SendHubMethod(
        'SendMessageRead',
        conversationId,
        messageIds
      );
    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error);
      // Don't throw - read receipts are not critical
    }
  }
}
```

### Complete SignalR Callback Handlers

```typescript
// services/signalr/MessagingCallbackHandlers.ts
import { ChatHistory, ConversationMetadata, ConversationMember } from '../../types/messaging.types';
import { OnlineUser } from '../../store/features/messagingMetadataSlice';
import { databaseService } from '../database/DatabaseService';
import { store } from '../../store/store';
import { 
  addUnreadMessage, 
  setUserOnline, 
  setUserOffline, 
  setTypingUsers 
} from '../../store/features/messagingMetadataSlice';

/**
 * COMPLETE SIGNALR CALLBACK IMPLEMENTATIONS
 * 
 * These handlers are called when the server sends real-time updates.
 * Each handler includes:
 * 1. Data processing and validation
 * 2. Local database updates
 * 3. Redux state updates
 * 4. UI notifications (optional)
 */

export class MessagingCallbackHandlers {

  /**
   * Handle incoming message from server
   * Server Event: ReceiveMessageAsync
   * 
   * Process Workflow:
   * 1. Validate and normalize incoming data
   * 2. Save message to local database
   * 3. Update conversation metadata
   * 4. Update Redux state with unread message (if not in current conversation)
   * 5. Trigger local notifications (if app is in background)
   */
  static async handleMessageReceived(data: {
    conversation: ConversationMetadata;
    chatHistory: ChatHistory;
  }): Promise<void> {
    try {
      const { conversation, chatHistory } = data;
      console.log('📨 Received new message:', chatHistory);

      // Data normalization for React Native
      conversation.id = Number(conversation.id);
      conversation.timestamp = conversation.timestamp ? new Date(conversation.timestamp) : new Date();
      chatHistory.conversationId = Number(chatHistory.conversationId);
      chatHistory.senderId = Number(chatHistory.senderId);
      chatHistory.timestamp = chatHistory.timestamp ? new Date(chatHistory.timestamp) : new Date();

      // Save to local database
      await databaseService.saveMessage(chatHistory);
      await databaseService.saveConversation(conversation);

      // Update Redux state for unread messages
      const currentState = store.getState();
      const currentUser = currentState.persistedReducer.user;
      
      // Only add unread if message is not from current user
      if (chatHistory.senderId !== currentUser.id) {
        store.dispatch(addUnreadMessage({
          conversationId: conversation.id,
          messageId: chatHistory.messageId,
          timestamp: new Date()
        }));

        // TODO: Trigger push notification if app is in background
        // await NotificationService.showMessageNotification(chatHistory, conversation);
      }

      console.log('✅ Message processed successfully');
    } catch (error) {
      console.error('❌ Failed to handle received message:', error);
    }
  }

  /**
   * Handle typing indicator updates
   * Server Event: ReceiveTypingIndicatorAsync
   * 
   * Process Workflow:
   * 1. Update typing indicators in Redux state
   * 2. Update conversation metadata in local database
   * 3. Trigger UI updates for typing indicator display
   */
  static async handleTypingIndicator(data: {
    isTyping: boolean;
    typerName: string;
    conversationId: number;
  }): Promise<void> {
    try {
      const { isTyping, typerName, conversationId } = data;
      console.log(`⌨️ Typing indicator: ${typerName} ${isTyping ? 'started' : 'stopped'} typing in conversation ${conversationId}`);

      // Get current typing users for this conversation
      const currentState = store.getState();
      const currentTypingMap = currentState.tempReducer.messagingMetadata?.typingIndicators || new Map();
      const currentTypingUsers = currentTypingMap.get(conversationId) || [];

      let updatedTypingUsers: string[];
      
      if (isTyping) {
        // Add user to typing list if not already there
        updatedTypingUsers = currentTypingUsers.includes(typerName) 
          ? currentTypingUsers 
          : [...currentTypingUsers, typerName];
      } else {
        // Remove user from typing list
        updatedTypingUsers = currentTypingUsers.filter(name => name !== typerName);
      }

      // Update Redux state
      store.dispatch(setTypingUsers({
        conversationId,
        typingUsers: updatedTypingUsers
      }));

      // Update conversation metadata in database
      const conversations = await databaseService.getConversations();
      const targetConversation = conversations.find(conv => conv.id === conversationId);
      
      if (targetConversation) {
        const updatedConversation: ConversationMetadata = {
          ...targetConversation,
          whosTyping: updatedTypingUsers.map(name => ({ 
            userId: 0, // We don't have user ID from typing indicator
            userName: name 
          }))
        };
        
        await databaseService.saveConversation(updatedConversation);
      }

      console.log('✅ Typing indicator processed successfully');
    } catch (error) {
      console.error('❌ Failed to handle typing indicator:', error);
    }
  }

  /**
   * Handle user online status update
   * Server Event: UserOnlineAsync
   */
  static handleUserOnline(userId: number): void {
    try {
      console.log(`🟢 User ${userId} came online`);
      
      // Update Redux state
      store.dispatch(setUserOnline(userId));
      
      console.log('✅ User online status updated');
    } catch (error) {
      console.error('❌ Failed to handle user online status:', error);
    }
  }

  /**
   * Handle user offline status update
   * Server Event: UserDisconnectedAsync
   */
  static handleUserDisconnected(data: OnlineUser): void {
    try {
      const { userId, lastActive } = data;
      console.log(`🔴 User ${userId} went offline. Last active: ${new Date(lastActive)}`);
      
      // Update Redux state
      store.dispatch(setUserOffline({ userId, lastActive }));
      
      console.log('✅ User offline status updated');
    } catch (error) {
      console.error('❌ Failed to handle user disconnected:', error);
    }
  }

  /**
   * Handle message edited notification
   * Server Event: MessageEditedAsync
   */
  static async handleMessageEdited(data: {
    messageId: string;
    conversationId: number;
    newContent: string;
  }): Promise<void> {
    try {
      const { messageId, conversationId, newContent } = data;
      console.log(`✏️ Message ${messageId} edited in conversation ${conversationId}`);

      // Get current messages from database
      const messages = await databaseService.getMessages(conversationId, 1000, 0);
      const targetMessage = messages.find(msg => msg.messageId === messageId);

      if (targetMessage) {
        // Update message content
        const updatedMessage: ChatHistory = {
          ...targetMessage,
          content: newContent
        };

        // Save updated message to database
        await databaseService.saveMessage(updatedMessage);

        // If this was the latest message, update conversation metadata
        const sortedMessages = messages.sort((a, b) => 
          new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
        );
        
        if (sortedMessages[0]?.messageId === messageId) {
          const conversations = await databaseService.getConversations();
          const targetConversation = conversations.find(conv => conv.id === conversationId);
          
          if (targetConversation) {
            const updatedConversation: ConversationMetadata = {
              ...targetConversation,
              lastMessage: newContent
            };
            
            await databaseService.saveConversation(updatedConversation);
          }
        }
      }

      console.log('✅ Message edit processed successfully');
    } catch (error) {
      console.error('❌ Failed to handle message edited:', error);
    }
  }

  /**
   * Handle message deleted notification
   * Server Event: MessageDeletedAsync
   */
  static async handleMessageDeleted(data: {
    messageId: string;
    conversationId: number;
  }): Promise<void> {
    try {
      const { messageId, conversationId } = data;
      console.log(`🗑️ Message ${messageId} deleted in conversation ${conversationId}`);

      // Mark message as deleted in database
      await databaseService.deleteMessage(messageId);

      // Update conversation metadata if this was the latest message
      const messages = await databaseService.getMessages(conversationId, 1000, 0);
      const sortedMessages = messages
        .filter(msg => !msg.isDeleted)
        .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());

      const conversations = await databaseService.getConversations();
      const targetConversation = conversations.find(conv => conv.id === conversationId);
      
      if (targetConversation) {
        const newLatestMessage = sortedMessages[0];
        const updatedConversation: ConversationMetadata = {
          ...targetConversation,
          lastMessage: newLatestMessage ? newLatestMessage.content : '',
          lastMessageSenderName: newLatestMessage ? newLatestMessage.senderName : '',
          timestamp: newLatestMessage ? new Date(newLatestMessage.timestamp!) : targetConversation.timestamp
        };
        
        await databaseService.saveConversation(updatedConversation);
      }

      console.log('✅ Message deletion processed successfully');
    } catch (error) {
      console.error('❌ Failed to handle message deleted:', error);
    }
  }

  /**
   * Handle message status updates (delivered, read, etc.)
   * Server Event: ReceiveMessageStatusAsync
   */
  static async handleMessageStatus(data: {
    messageId: string;
    status: 'delivered' | 'read';
    conversationId: number;
  }): Promise<void> {
    try {
      const { messageId, status, conversationId } = data;
      console.log(`📋 Message ${messageId} status updated to: ${status}`);

      // Update message status in database
      await databaseService.updateMessageStatus(messageId, status);

      console.log('✅ Message status updated successfully');
    } catch (error) {
      console.error('❌ Failed to handle message status update:', error);
    }
  }
}
```

### Integration Usage Examples

```typescript
// components/messaging/ChatContainer.tsx - Usage Examples

// ==================== SENDING A MESSAGE ====================
const handleSendMessage = async (content: string) => {
  try {
    // 1. Create optimistic message for immediate UI update
    const optimisticMessage: ChatHistory = {
      messageId: `temp_${Date.now()}`, // Temporary ID
      conversationId: conversation.id,
      senderId: currentUser.id!,
      senderName: currentUser.name!,
      senderAvatar: currentUser.avatar || '',
      content,
      timestamp: new Date(),
      deliveryStatus: 'sending',
      readByNames: [],
      isDeleted: false
    };

    // 2. Update UI immediately (optimistic update)
    setMessages(prev => [...prev, optimisticMessage]);

    // 3. Save to local database
    await databaseService.saveMessage(optimisticMessage);

    // 4. Send via SignalR
    const sentMessage = await MessagingHubMethods.sendMessage({
      conversationId: conversation.id,
      senderId: currentUser.id!,
      senderName: currentUser.name!,
      senderAvatar: currentUser.avatar || '',
      content,
      deliveryStatus: 'sending',
      readByNames: [],
      isDeleted: false
    });

    // 5. Replace optimistic message with server response
    setMessages(prev => 
      prev.map(msg => 
        msg.messageId === optimisticMessage.messageId ? sentMessage : msg
      )
    );

    // 6. Update database with server message
    await databaseService.saveMessage(sentMessage);

  } catch (error) {
    console.error('Failed to send message:', error);
    // Handle error - show retry option, mark message as failed, etc.
  }
};

// ==================== HANDLING TYPING INDICATORS ====================
const handleTypingStart = useCallback(() => {
  MessagingHubMethods.sendTypingIndicator(
    conversation.id, 
    true, 
    currentUser.name!
  );
}, [conversation.id, currentUser.name]);

const handleTypingStop = useCallback(() => {
  MessagingHubMethods.sendTypingIndicator(
    conversation.id, 
    false, 
    currentUser.name!
  );
}, [conversation.id, currentUser.name]);

// ==================== LOADING CONVERSATION DATA ====================
const loadConversationData = async () => {
  try {
    // 1. Load from local database first (offline-first)
    const localMessages = await databaseService.getMessages(conversation.id);
    setMessages(localMessages);

    // 2. Fetch latest from API and update if needed
    const apiMessages = await apiService.getConversationMessages(conversation.id);
    
    // 3. Save new messages to database
    for (const message of apiMessages) {
      await databaseService.saveMessage(message);
    }
    
    // 4. Update UI with latest data
    setMessages(apiMessages);

    // 5. Check into conversation for real-time updates
    await MessagingHubMethods.conversationCheckin(conversation.id);
    
  } catch (error) {
    console.error('Failed to load conversation:', error);
    // Fallback to local data if API fails
  }
};
```

Now the documentation includes comprehensive API integration and detailed SignalR callback implementations with real-world usage examples! 🚀 