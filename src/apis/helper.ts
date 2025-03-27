import { LinuxShellAPI } from "./linux-shell";
import { existsSync } from "fs";

export class BackupHelper {

    static getDBDump(cakeBin: string, webServerUser: string) {
        if (!existsSync(cakeBin)) {
            throw new Error("Invalid cakeBin path.");
        }
        if (!/^[a-z_][a-z0-9_-]*[$]?$/.test(webServerUser)) {
            throw new Error("Invalid webServerUser.");
        }
        
        const promise = Bun.$`su -s /bin/bash -c "${cakeBin} passbolt mysql_export" ${webServerUser}`;
        return LinuxShellAPI.handleExec(promise);
    }

}