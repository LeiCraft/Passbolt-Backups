import { LinuxShellAPI } from "./linux-shell";
import { existsSync } from "fs";

export class BackupHelper {

    static async getNewDBDump(cakeBin: string, webServerUser: string) {
        if (!existsSync(cakeBin)) {
            throw new Error("Invalid cakeBin path.");
        }
        if (!/^[a-z_][a-z0-9_-]*[$]?$/.test(webServerUser)) {
            throw new Error("Invalid webServerUser.");
        }
        
        const backupFileName = "passbolt_backup_" + Date.now() + ".sql";
        const backupFilePath = `/tmp/${backupFileName}`;

        const promise = Bun.$`su -s /bin/bash -c "${cakeBin} passbolt sql_export --dir /tmp --file ${backupFileName}" ${webServerUser}`;
        await LinuxShellAPI.handleExec(promise);

        if (!existsSync(backupFilePath)) {
            throw new Error("Failed to create backup file.");
        }
        const fileContent = await LinuxShellAPI.getFile(backupFilePath);
        await LinuxShellAPI.delFile(backupFilePath);

        return fileContent;
    }

}