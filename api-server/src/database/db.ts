// Ponte entre o main file (./database/db.js) e o pacote @workspace/db
export { db, usersTable, guildSettingsTable, commandLogsTable, duelsTable, tellonymTable, shopItemsTable, inventoryTable } from "@workspace/db";

export function loadDB(): void {
  // Conexão gerenciada pelo pool do @workspace/db — nada a fazer aqui
}
