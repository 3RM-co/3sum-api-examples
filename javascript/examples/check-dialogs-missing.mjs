import "dotenv/config";
import axios from "axios";

const API_TOKEN = process.env.TREE_SUM_API_TOKEN;

if (!API_TOKEN) {
  throw new Error("Missing TREE_SUM_API_TOKEN token");
}

const FOLDER_LIMIT = 5;

const api = axios.create({
  baseURL: "https://api-prod.3sum.me/",
  headers: {
    "public-api-token": API_TOKEN,
    "Content-Type": "application/json",
  },
});

async function fetchTelegramFolders() {
  console.log("Fetching Telegram folders");

  try {
    const response = await api.get("/trpc/apiv1.telegram.folders");
    const folders = response.data.result.data;

    if (folders.length === 0) {
      throw new Error("Your Telegram account does not have any folders");
    }

    return folders;
  } catch (error) {
    console.error("Failed to fetch Telegram folders", error);
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
    console.error(`Failed to fetch dialogs for folder ID: ${folderId}`, error);
    throw error;
  }
}

async function main() {
  const folders = (await fetchTelegramFolders()).slice(0, FOLDER_LIMIT);

  for (const folder of folders) {
    const dialogs = await fetchDialogsByFolder(folder.id);
    folder["realDialogs"] = dialogs.length;
  }

  console.table(folders);
}

main();
