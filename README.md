## 3Sum.me API examples

### Grab API key
- Go to [Settings](https://app.3sum.me/settings) > API > Generate your API token

### Run the code
- `cd javascript && npm install`
- `cp .env.example .env`, update API token
- Run the script via `npm run start`, make sure you have Node.js 18+ installed

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
          "date": 0,                // UNIX timestamp of the message
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

## Error Handling

The API will return appropriate HTTP status codes along with error messages in case of failures. Common error codes include:

- `401`: Unauthorized - Invalid or missing API token
- `400`: Bad Request - Invalid request parameters
- `500`: Internal Server Error - Server-side error

## Security Considerations

- Your Telegram messages are encrypted and only decrypted when generating responses for you
- Always keep your API token secure and do not share it with others

