import 'dotenv/config'
import axios from 'axios';

const API_TOKEN = process.env.TREE_SUM_API_TOKEN;

if (!API_TOKEN) {
  throw new Error('Missing TREE_SUM_API_TOKEN token');
}

const messagesPerPage = 4;
const maxMessageCount = 12;

const api = axios.create({
  baseURL: 'https://api-prod.3sum.me/',
  headers: {
    'public-api-token': API_TOKEN,
    'Content-Type': 'application/json'
  }
});

const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()}: ${message}`),
  error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error)
};

// 1. First we make a request to sync Telegram messages
// This way we ask 3Sum to fetch up-to-date data from Telegram
async function syncTelegramMessages() {
  const timePeriod = '1h';
  logger.info(`Starting Telegram sync with time period: ${timePeriod}`);
  
  try {
    const response = await api.post('/trpc/apiv1.telegram.syncTelegram', {
      timePeriod
    });
    
    logger.info(`Sync completed: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    logger.error('Failed to sync Telegram messages', error);
    throw error;
  }
}

// 2. Then we fetch messages from 3Sum
// Cursor-based pagination is used here
async function fetchTelegramMessages(cursor = null, limit = messagesPerPage) {
  logger.info(`Fetching messages with limit: ${limit}, cursor: ${cursor || 'initial'}`);
  
  try {
    const input = { limit };
    if (cursor) {
      input.cursor = cursor;
    }
    
    const response = await api.get(`/trpc/apiv1.telegram.messages`, {
      params: {
        input: JSON.stringify(input)
      }
    });
    
    const data = response.data.result.data;
    logger.info(`Retrieved ${data.messages.length} messages`);
    
    return data;
  } catch (error) {
    logger.error('Failed to fetch Telegram messages', error);
    throw error;
  }
}

async function main() {
  try {
    await syncTelegramMessages();
    
    let allMessages = [];
    let nextCursor = null;
    
    do {
      const data = await fetchTelegramMessages(nextCursor);
      allMessages = [...allMessages, ...data.messages];
      nextCursor = data.nextCursor;
      
      logger.info(`Total messages fetched so far: ${allMessages.length}`);
    } while (nextCursor && allMessages.length < maxMessageCount);
    
    logger.info(`All messages fetched successfully. Total: ${allMessages.length}`);
    return allMessages;
  } catch (error) {
    logger.error('Process failed', error);
    throw error;
  }
}

// Run the main function
main()
  .then(messages => {
    logger.info(`Process completed with ${messages.length} messages`);
    console.log("Messages: ", messages);
  })
  .catch(error => {
    console.error('Failed to execute main function', error);
    process.exit(1);
  });