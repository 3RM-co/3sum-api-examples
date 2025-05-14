import "dotenv/config";
import axios from "axios";

const API_TOKEN = process.env.TREE_SUM_API_TOKEN;

if (!API_TOKEN) {
  throw new Error("Missing TREE_SUM_API_TOKEN token");
}

const FOLDER_LIMIT = 5;

const api = axios.create({
  baseURL: process.env.TREE_SUM_API_BASE_URL || "https://api-prod.3sum.me/",
  headers: {
    "public-api-token": API_TOKEN,
    "Content-Type": "application/json",
  },
});

function generateTelegramLink(chatId) {
  return `https://web.telegram.org/k/#${chatId}`;
}

async function fetchTelegramFolders() {
  console.log("Fetching Telegram folders");

  try {
    const response = await api.get("/trpc/apiv1.telegram.folders", {
      params: {
        input: JSON.stringify({
          includeChatIds: true,
        }),
      },
    });
    const folders = response.data.result.data;

    if (folders.length === 0) {
      throw new Error("Your Telegram account does not have any folders");
    }

    return folders;
  } catch (error) {
    console.error("Failed to fetch Telegram folders");
    throw error;
  }
}

async function fetchDialogsByFolder(folderId) {
  console.log(`Fetching dialogs for folder ID: ${folderId}`);

  try {
    const response = await api.get(`/trpc/apiv1.telegram.dialogsByFolder`, {
      params: {
        input: JSON.stringify({
          folderId,
          maxParticipants: 0,
          maxMessages: 0,
          includeBots: true,
        }),
      },
    });

    const dialogs = response.data.result.data;

    return dialogs;
  } catch (error) {
    console.error(`Failed to fetch dialogs for folder ID: ${folderId}`);
    throw error;
  }
}

async function main() {
  const folders = (await fetchTelegramFolders()).slice(0, FOLDER_LIMIT);

  console.log("\n=== FOLDER SUMMARY ===\n");
  console.table(
    folders.map((folder) => ({
      id: folder.id,
      title: folder.title,
      dialogCount: folder.dialogCount,
    })),
  );

  console.log("\n=== DETAILED ANALYSIS ===\n");

  for (const folder of folders) {
    const dialogs = await fetchDialogsByFolder(folder.id);
    const dialogChatIds = dialogs.map((dialog) => dialog.dialog.id);

    const missingChatIds = folder.chatIds
      ? folder.chatIds.filter((id) => !dialogChatIds.includes(id))
      : [];
    const missingCount = folder.chatIds
      ? folder.chatIds.length - dialogs.length
      : 0;

    console.log(`\n📁 FOLDER: ${folder.title} (ID: ${folder.id})`);
    console.log(`   Expected dialogs: ${folder.dialogCount}`);
    console.log(`   Actual dialogs:   ${dialogs.length}`);
    console.log(`   Missing dialogs:  ${missingCount}`);

    if (missingChatIds.length > 0) {
      console.log("\n   Missing chat links:");
      missingChatIds.forEach((chatId, index) => {
        console.log(`   ${index + 1}. ${generateTelegramLink(chatId)}`);
      });
    } else {
      console.log("\n   No missing chats.");
    }

    console.log("\n" + "-".repeat(50));
  }
}

main().catch((error) => {
  if (error instanceof AxiosError) {
    console.error("Failed to execute main function", error.response.data);
  } else {
    console.error("Failed to execute main function", error);
  }
  process.exit(1);
});
