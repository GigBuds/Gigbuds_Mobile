# MessagesController API Documentation

## Overview

The MessagesController provides endpoints for managing conversations and messages within the Gigbuds platform. It handles conversation metadata, message creation, retrieval, updates, and deletions with real-time SignalR support.

**Base Route**: `/api/Messages`

---

## Endpoints

### 1. GET /conversation-metadata

**Description**: Retrieves paginated conversations with metadata for a user

**Method**: `GET`  
**Route**: `/conversation-metadata`

#### Input Parameters (Query Parameters)

**Type**: `ConversationQueryParams`

```json
{
  "userId": 123, // int - ID of the user making the request (-1 for all)
  "searchTerm": "john", // string (optional) - Search term for conversation names
  "pageIndex": 1, // int - Page number (starts at 1, default: 1)
  "pageSize": 10 // int - Items per page (max: 20, default: 5)
}
```

#### Response

**Type**: `PagedResultDto<ConversationMetaDataDto>`
**Status Code**: 200 OK

```json
{
  "count": 25,
  "data": [
    {
      "id": "conv_123", // string - Conversation ID (Redis string format)
      "creatorId": 456, // int - User ID who created the conversation
      "nameOne": "John Doe", // string - First participant name
      "nameTwo": "Jane Smith", // string - Second participant name
      "avatarOne": "https://...", // string - First participant avatar URL
      "avatarTwo": "https://...", // string - Second participant avatar URL
      "lastMessage": "Hello there!", // string - Content of last message
      "lastMessageSenderName": "John", // string - Name of last message sender
      "lastMessageId": "msg_789", // string - ID of last message
      "timestamp": "2024-01-15T10:30:00Z", // DateTime - Last activity timestamp
      "isOnline": true, // bool - Online status indicator
      "whosTyping": [
        // ConversationMemberDto[] - Currently typing users
        {
          "userId": 123,
          "userName": "John Doe"
        }
      ],
      "memberIds": ["123", "456"], // string[] - Array of member IDs
      "members": [
        // ConversationMemberDto[] - Full member details
        {
          "userId": 123,
          "userName": "John Doe"
        },
        {
          "userId": 456,
          "userName": "Jane Smith"
        }
      ]
    }
  ]
}
```

---

### 2. POST /conversation-metadata

**Description**: Creates a new conversation between users

**Method**: `POST`  
**Route**: `/conversation-metadata`

#### Input Parameters (Request Body)

**Type**: `CreateConversationCommand`

```json
{
  "members": {
    // Dictionary<int, string> - Member ID to display name mapping
    "123": "John Doe",
    "456": "Jane Smith"
  },
  "creatorId": "123", // string - ID of user creating the conversation
  "conversationNameOne": "John Doe", // string - Display name for first participant
  "conversationNameTwo": "Jane Smith", // string - Display name for second participant
  "avatarOne": "https://...", // string - Avatar URL for first participant
  "avatarTwo": "https://...", // string - Avatar URL for second participant
  "createdAt": "2024-01-15T10:30:00Z" // DateTime - Creation timestamp
}
```

#### Response

**Type**: `ConversationMetaDataDto`
**Status Code**: 200 OK

```json
{
  "id": "conv_123",
  "creatorId": 123,
  "nameOne": "John Doe",
  "nameTwo": "Jane Smith",
  "avatarOne": "https://...",
  "avatarTwo": "https://...",
  "lastMessage": "",
  "lastMessageSenderName": "",
  "lastMessageId": "",
  "timestamp": "2024-01-15T10:30:00Z",
  "isOnline": false,
  "whosTyping": [],
  "memberIds": ["123", "456"],
  "members": [
    {
      "userId": 123,
      "userName": "John Doe"
    },
    {
      "userId": 456,
      "userName": "Jane Smith"
    }
  ]
}
```

---

### 3. GET /conversation-messages

**Description**: Retrieves paginated messages for a specific conversation

**Method**: `GET`  
**Route**: `/conversation-messages`

#### Input Parameters (Query Parameters)

**Type**: `MessagesQueryParams`

```json
{
  "conversationId": 123, // int - ID of the conversation to get messages from
  "searchTerm": "hello", // string (optional) - Search term for message content
  "pageIndex": 1, // int - Page number (starts at 1, default: 1)
  "pageSize": 10 // int - Items per page (max: 20, default: 5)
}
```

#### Response

**Type**: `PagedResultDto<ChatHistoryDto>`
**Status Code**: 200 OK

```json
{
  "count": 50,
  "data": [
    {
      "messageId": "msg_123", // string - Unique message ID (Redis string format)
      "conversationId": 456, // int - ID of parent conversation
      "senderId": 789, // int - ID of message sender
      "senderName": "John Doe", // string - Display name of sender
      "senderAvatar": "https://...", // string - Avatar URL of sender
      "readByNames": ["Jane Smith", "Mike"], // string[] - Names of users who read the message
      "isDeleted": false, // bool - Soft deletion flag
      "timestamp": "2024-01-15T10:30:00Z", // DateTime - Message creation time (sortable)
      "deliveryStatus": "Read", // DeliveryStatus enum - Message delivery status
      "content": "Hello there! How are you?" // string - Message content (searchable)
    }
  ]
}
```

**DeliveryStatus Enum Values**:

- `0` - `Sending`: Message is being sent
- `1` - `Delivered`: Message has been delivered
- `2` - `Read`: Message has been read
- `3` - `Failed`: Message delivery failed

---

### 4. PUT /conversation-messages

**Description**: Updates an existing message

**Method**: `PUT`  
**Route**: `/conversation-messages`

#### Input Parameters (Request Body)

**Type**: `ChatHistoryDto`

```json
{
  "messageId": "msg_123", // string - ID of message to update
  "conversationId": 456, // int - Parent conversation ID
  "senderId": 789, // int - Original sender ID
  "senderName": "John Doe", // string - Sender display name
  "senderAvatar": "https://...", // string - Sender avatar URL
  "readByNames": ["Jane Smith"], // string[] - Updated read receipts
  "isDeleted": false, // bool - Deletion status
  "timestamp": "2024-01-15T10:30:00Z", // DateTime - Original timestamp
  "deliveryStatus": "Read", // DeliveryStatus - Updated delivery status
  "content": "Hello there! How are you today?" // string - Updated message content
}
```

#### Response

**Type**: `void`
**Status Code**: 200 OK

```json
// No response body - returns empty 200 OK on success
```

---

### 5. DELETE /conversation-messages/{messageId}

**Description**: Soft deletes a message by setting isDeleted flag

**Method**: `DELETE`  
**Route**: `/conversation-messages/{messageId}`

#### Input Parameters

**Path Parameter**:

- `messageId` (string) - ID of the message to delete

#### Response

**Type**: `int`
**Status Code**: 200 OK

```json
1 // Returns the number of affected records (typically 1 for successful deletion)
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": "Invalid input parameters"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized access"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found",
  "details": "Conversation or message not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "details": "An unexpected error occurred"
}
```

---

## Data Models Reference

### ConversationMemberDto

```json
{
  "userId": 123, // int - User identifier
  "userName": "John Doe" // string - User display name
}
```

### BasePagingParams

```json
{
  "pageIndex": 1, // int - Page number (starts at 1, default: 1)
  "pageSize": 5 // int - Items per page (max: 20, default: 5)
}
```

### PagedResultDto<T>

```json
{
  "count": 25, // int - Total number of items
  "data": [] // T[] - Array of items for current page
}
```

---

## Notes

1. **Real-time Updates**: This controller integrates with SignalR for real-time messaging functionality
2. **Redis Integration**: Messages and conversations are cached/stored in Redis for performance
3. **Pagination**: All list endpoints support pagination with configurable page sizes (max 20 items)
4. **Search**: Conversation and message endpoints support text search functionality
5. **Soft Deletion**: Messages are soft-deleted (isDeleted flag) rather than permanently removed
6. **Authentication**: All endpoints require proper authentication (handled by base controller)
7. **String IDs**: Redis-based entities use string IDs rather than integers for compatibility with Redis.OM

## Dependencies

- **MediatR**: For CQRS pattern implementation
- **SignalR**: For real-time messaging
- **Redis.OM**: For Redis object mapping and search
- **AutoMapper**: For DTO mapping
