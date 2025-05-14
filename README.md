## 3Sum.me API examples

### Prerequisites
- Make sure you have Telegram account connected in [app.3sum.me](https://app.3sum.me)
- Go to [Settings](https://app.3sum.me/settings) > API > Generate your API token

### Run the code
- `cd javascript && npm install`
- `cp .env.example .env`, update API token
- Make sure you have Node.js 18+ installed. Run the scripts:
  - `npm run fetch-messages`
  - `npm run fetch-folder-dialogs`

### 3Sum API Documentation

Swagger URL: https://app.3sum.me/api-docs

This document provides detailed information about the 3Sum API endpoints, their functionality, parameters, and responses.

## Authentication

The 3Sum API uses an API token for authentication. Protected endpoints require this token to be included in the request header.

**Header Name**: `public-api-token`

## Endpoints

### Health Check (Public)

A test endpoint to verify if the API is working. This endpoint doesn't require authentication.

**Endpoint**: `/trpc/apiv1.healthcheck.public`  
**Method**: GET  
**Description**: Checks if the API is operational without requiring authentication.

#### Response

```json
{
  "result": {
    "data": {
      "status": "string"
    }
  }
}
```

### Health Check (Protected)

A test endpoint that requires authentication to access.

**Endpoint**: `/trpc/apiv1.healthcheck.protected`  
**Method**: GET  
**Description**: Returns the user ID when a valid token is provided. Returns an unauthorized error if a valid token is not provided.  
**Authentication**: Required

#### Response

```json
{
  "result": {
    "data": {
      "userId": "string"
    }
  }
}
```

### Sync Telegram

Synchronizes your recent Telegram messages with 3Sum.

**Endpoint**: `/trpc/apiv1.telegram.syncTelegram`  
**Method**: POST  
**Description**: Syncs your Telegram messages for a specified time period. Your messages are encrypted and only decrypted when generating a response for you.  
**Authentication**: Required

#### Request Body

```json
{
  "timePeriod": "1h" // Options: "1h", "3h", "1d", "7d", "2w", "1mo"
}
```

#### Time Period Information

- `1h`: Syncs messages from the last hour (takes approximately 10 seconds)
- `3h`: Syncs messages from the last 3 hours
- `1d`: Syncs messages from the last day
- `7d`: Syncs messages from the last week
- `2w`: Syncs messages from the last 2 weeks
- `1mo`: Syncs messages from the last month (can take up to 5 minutes)

#### Response

```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

### Get Telegram Messages

Retrieves your Telegram messages with cursor-based pagination.

**Endpoint**: `/trpc/apiv1.telegram.messages`  
**Method**: GET  
**Description**: Returns your Telegram messages with pagination support.  
**Authentication**: Required

#### Query Parameters

- `cursor` (optional): Used for cursor-based pagination. Use the `nextCursor` field from a previous API response to get the next page of data.
- `limit` (optional): Specifies how many messages to return per request. Must be between 1 and 300. Default is 10.

#### Response

```json
{
  "result": {
    "data": {
      "messages": [
        {
          "id": "string",           // 3Sum message ID (unique)
          "telegramId": "string",   // Telegram message ID (non-unique)
          "text": "string",         // Message text
          "date": "string",         // UNIX timestamp of the message
          "chatId": "string",       // Telegram chat ID
          "parentType": "dm",       // Enum: "dm", "channel", or "group"
          "fromId": "string",       // Telegram ID of sender (if known)
          "fromTitle": "string",    // Name of sender
          "out": true,              // Whether it's your message
          "chatUsername": "string", // Chat username (if available)
          "chatTitle": "string"     // Title of the Telegram chat
        }
      ],
      "nextCursor": 0  // Use this value for the next pagination request
    }
  }
}
```

### Get Telegram Folders

Retrieves your Telegram folders.

**Endpoint**: `/trpc/apiv1.telegram.folders`  
**Method**: GET  
**Description**: Returns your Telegram folders.  
**Authentication**: Required

#### Response

```json
{
  "result": {
    "data": [
      {
        "id": 0,            // Folder ID
        "title": "string",  // Folder title
        "dialogCount": 0    // Number of dialogs in folder
      }
    ]
  }
}
```

### Get Telegram Dialogs By Folder

Retrieves your Telegram dialogs within a specific folder. Bear in mind limits:
- Conversations where the last message is more than 6 months old will not be returned
- You can change `maxParticipants` but the max value is 200
- Only 5 last messages are returned per conversation
- Telegram chat IDs might change when a group is migrated to a supergroup. In a future version of the 3Sum API we plan to expose a stable, unique 3Sum ID for each chat to ensure consistent identification

**Endpoint**: `/trpc/apiv1.telegram.dialogsByFolder`  
**Method**: GET  
**Description**: Returns your Telegram dialogs for a specified folder.  
**Authentication**: Required

#### Query Parameters

- `folderId` (required): The ID of the folder to retrieve dialogs from.
- `maxParticipants` (optional): Maximum number of participants to retrieve per dialog (0-200). Default 10. Pass 0 to skip fetching participants.
- `maxMessages` (optional): Maximum number of messages to fetch per chat (0-5). Default 3. Pass 0 to skip fetching messages.
- `includeBots` (optional): Whether to include Telegram bots. Default is true.

#### Response

```json
{
  "result": {
    "data": [
      {
        "dialog": {
          "id": "string",               // Telegram chat ID (can change when a group is migrated to a supergroup)
          "title": "string",            // Chat title
          "lastMessageDate": "string",  // UNIX timestamp of the last message
          "username": "string",         // Chat username (if available, only first one is returned for multiple usernames)
          "type": "dm"                  // Enum: "dm", "channel", or "group"
        },
        "messages": [
          {
            "id": "string",             // Telegram message ID (not unique across all messages)
            "messageText": "string",    // Message text content
            "date": "string",           // UNIX timestamp of the message
            "sender": {
              "id": "string",           // Telegram user ID
              "username": "string",     // User's username (if available)
              "name": "string"          // User's name (first and last name)
            }
          }
        ],
        "participants": [
          {
            "id": "string",             // Participant ID
            "username": "string",       // Participant username (if available)
            "name": "string"            // Participant name
          }
        ]
      }
    ]
  }
}
```

## Error Handling

The API will return appropriate HTTP status codes along with error messages in case of failures. Common error codes include:

- `401`: Unauthorized - Invalid or missing API token
- `400`: Bad Request - Invalid request parameters
- `500`: Internal Server Error - Server-side error

## Security Considerations

- Your Telegram messages are encrypted and only decrypted when generating responses for you
- Always keep your API token secure and do not share it with others

## Issues 

### Dialogs are missing

The Telegram API is tricky and sometimes doesn't send complete information since it relies on Telegram clients like Telegram iOS / Android to maintain state. This design optimizes Telegram's bandwidth but can lead to missing data from Telegram API. One of 3Sum goals is to provide you worry-free access to your Telegram. 

To check if any dialogs are missing, run the `npm run check-dialogs-missing` script. This script compares the number of dialogs Telegram reports to have with the actual number of dialogs it returns, and prints the difference. This can help identify potential discrepancies in dialog retrieval. If you have a large number of dialogs missing, please contact us with the folder ID, expected number of dialogs, and actual number of dialogs, and we'll help you resolve the issue.

If you miss just a couple of dialogs it can also be due to the following reasons:
- private channels (not groups, usually paid ones)
- groups with topics (https://blog.invitemember.com/telegram-topics/)
- secret chats (https://www.airdroid.com/parent-control/telegram-secret-chat/)

So far we support only DMs, groups (private & public), supergroups and channels (only public)
