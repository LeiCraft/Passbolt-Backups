import { CLICMD, type CLICMDExecMeta } from "@cleverjs/cli";
import { S3Service } from "../s3-service.js";
import { Utils } from "../utils.js";
import { BackupArchive, type RawBackupArchive, type FileList } from "../archive.js";
import { LinuxShellAPI } from "../apis/linux-shell.js";
import { Uint64 } from "low-level";
import { BackupHelper } from "../apis/helper.js";

export class CreateBackupCMD extends CLICMD {
    readonly name = "create";
    readonly description = "Creates a backup of the Passbolt data and uploads it to the S3 bucket.";
    readonly usage = "create [--config=<path_to_env>] [--as-cron]";
    
    async run(args: string[], meta: CLICMDExecMeta) {
        
        const result = await Utils.parseDefaultArgs(args);
        const flags = result.flags;
        const config = result.config;
        args = result.args;

        if (flags["--as-cron"] && !config.PB_AUTO_BACKUP) {
            console.error("Automatic backup is not enabled.");
            process.exit(1);
        }

        const timeStamp = Date.now();

        console.log(`Creating new backup of Passbolt at ${new Date(timeStamp).toLocaleString()}`);
        const files: FileList = {};

        files["data/passbolt.sql"] = await BackupHelper.getNewDBDump(config.PB_CAKE_BIN, config.PB_WEB_SERVER_USER);
        console.log("Database dump created.");

        files["gpg/serverkey_private.asc"] = await LinuxShellAPI.getFile(config.PB_GPG_SERVER_PRIVATE_KEY);
        files["gpg/serverkey.asc"] = await LinuxShellAPI.getFile(config.PB_GPG_SERVER_PUBLIC_KEY);
        console.log("GPG keys copied.");

        if (config.PB_PASSBOLT_CONFIG_FILE) {
            files["config/passbolt.php"] = await LinuxShellAPI.getFile(config.PB_PASSBOLT_CONFIG_FILE);
            console.log("Passbolt config copied.");
        }

        if (config.PB_SAVE_ENV) {
            files["env/passbolt.env"] = await LinuxShellAPI.getEnv();
            console.log("Environment variables copied.");
        }

        console.log("Creating backup archive...");
        const archive = BackupArchive.fromFileList(Uint64.from(timeStamp), files);

        let rawArchive: RawBackupArchive;
        if (config.PB_ENCRYPTION_PASSPHRASE) {
            rawArchive = archive.encrypt(config.PB_ENCRYPTION_PASSPHRASE);
            console.log("Encrypted successfully created.");
        } else {
            rawArchive = archive.toRaw();
            console.log("Unencrypted successfully created.");
        }

        console.log("Uploading backup to S3...");

        const s3 = S3Service.fromConfig(config);
        await s3.uploadBackup(rawArchive);

        console.log(`Backup successfully uploaded to S3`);
    }
}
