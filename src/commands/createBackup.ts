import { CLICMD, type CLICMDExecMeta } from "@cleverjs/cli";
import { S3Service } from "../s3-service.js";
import { Utils } from "../utils.js";
import { BackupArchive, type FileList } from "../archive.js";
import { LinuxShellAPI } from "../apis/linux-shell.js";
import { Uint64 } from "low-level";
import { BackupHelper } from "../apis/helper.js";


export class CreateBackupCMD extends CLICMD {
    readonly name = "create";
    readonly description = "Creates a backup of the Passbolt data and uploads it to the S3 bucket.";
    readonly usage = "create [--config=<path_to_env>]";

    async run(args: string[], meta: CLICMDExecMeta) {
        
        const result = await Utils.parseDefaultArgs(args);
        const config = result.config;
        args = result.args;
        
        const s3 = new S3Service({
            endpoint: config.S3_ENDPOINT,
            accessKeyId: config.S3_ACCESS_KEY_ID,
            secretAccessKey: config.S3_SECRET_ACCESS_KEY,
            bucket: config.S3_BUCKET,
            basePath: config.S3_BASE_PATH
        });

        const files: FileList = {};

        files["data/passbolt.sql"] = await BackupHelper.getDBDump(config.CAKE_BIN, config.WEB_SERVER_USER);

        files["gpg/serverkey_private.asc"] = await LinuxShellAPI.getFile(config.GPG_SERVER_PRIVATE_KEY);
        files["gpg/serverkey.asc"] = await LinuxShellAPI.getFile(config.GPG_SERVER_PUBLIC_KEY);

        if (config.PASSBOLT_CONFIG_FILE) {
            files["config/passbolt.php"] = await LinuxShellAPI.getFile(config.PASSBOLT_CONFIG_FILE);
        }

        if (config.SAVE_ENV === "true") {
            files["env/passbolt.env"] = await LinuxShellAPI.getEnv();
        }

        const archive = BackupArchive.fromFileList(Uint64.from(Date.now()), files);

        const rawArchive = config.ENCRYPTION_PASSPHRASE ? archive.encrypt(config.ENCRYPTION_PASSPHRASE) : archive.toRaw();

        await s3.uploadBackup(rawArchive);

    }
}
