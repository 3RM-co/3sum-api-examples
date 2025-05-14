import "dotenv/config";
import axios, { AxiosError } from "axios";

const API_TOKEN = process.env.TREE_SUM_API_TOKEN;

if (!API_TOKEN) {
  throw new Error("Missing TREE_SUM_API_TOKEN token");
}

const maxParticipants = 50;

const api = axios.create({
  baseURL: process.env.TREE_SUM_API_BASE_URL || "https://api-prod.3sum.me/",
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

    console.log(`Retrieved ${folders.length} folders`);

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
          maxParticipants,
          maxMessages: 3,
          includeBots: false,
        }),
      },
    });

    const dialogs = response.data.result.data;
    console.log(`Retrieved ${dialogs.length} dialogs from folder`);

    return dialogs;
  } catch (error) {
    console.error(`Failed to fetch dialogs for folder ID: ${folderId}`);
    throw error;
  }
}

async function main() {
  // Step 1: Fetch folders
  const folders = await fetchTelegramFolders();
  console.log(
    `Available folders: ${folders.map((f) => `${f.id}: ${f.title}`).join(", ")}`,
  );

  // Step 2: Use the first folder to fetch dialogs
  const firstFolder = folders[0];
  console.log(`Using folder: ${firstFolder.title} (ID: ${firstFolder.id})`);

  // Step 3: Fetch dialogs from the first folder
  const dialogs = await fetchDialogsByFolder(firstFolder.id);

  return {
    folder: firstFolder,
    dialogs,
  };
}

// Run the main function
main()
  .then((result) => {
    console.log(`Process completed successfully`);
    console.log(`Folder: ${result.folder.title} (ID: ${result.folder.id})`);
    console.log(`Retrieved ${result.dialogs.length} dialogs`);

    // Print dialog information
    console.log("\nDialogs:");
    result.dialogs.forEach((dialog, index) => {
      console.log(
        `\n${index + 1}. ${dialog.dialog.title} (${dialog.dialog.type})`,
      );
      console.log(`   Messages: ${dialog.messages.length}`);
      console.log(`   Participants: ${dialog.participants.length}`);

      // Print a sample message if available
      if (dialog.messages.length > 0) {
        const sampleMessage = dialog.messages[0];
        console.log(
          `   Sample message: "${sampleMessage.messageText.substring(0, 50)}${sampleMessage.messageText.length > 50 ? "..." : ""}"`,
        );
        console.log(`   From: ${sampleMessage.sender.name}`);
      }
    });
  })
  .catch((error) => {
    if (error instanceof AxiosError) {
      console.error("Failed to execute main function", error.response.data);
    } else {
      console.error("Failed to execute main function", error);
    }
    process.exit(1);
  });
