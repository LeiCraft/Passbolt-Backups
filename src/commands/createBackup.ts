import { CLICMD, type CLICMDExecMeta } from "@cleverjs/cli";
import { BackupManager } from "../manager.js";
import { S3Service } from "../s3-service.js";
import { Utils } from "../utils.js";
import type { RawBackupArchive } from "../archive.js";


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
        })

        switch (config.INSTALLATION_TYPE) {
            case "default": {

                throw new Error("Not implemented yet.");

                break;
            }
            case "docker": {

                const archive = await BackupManager.createDockerBackup({
                    passboltContainerName: config.DOCKER_PASSBOLT_CONTAINER,
                    passboltEnvPath: config.DOCKER_POSSBOLT_ENV,
                    dbContainerName: config.DOCKER_DB_CONTAINER,
                    dbType: config.DOCKER_DB_TYPE,
                    dbEnvPath: config.DOCKER_DB_ENV,
                    liveEnv: config.DOCKER_LIVE_ENV
                } as any);

                let rawArchive: RawBackupArchive;

                if (config.ENCRYPTION_PASSPHRASE) {
                    rawArchive =  archive.encrypt(config.ENCRYPTION_PASSPHRASE);
                } else {
                    rawArchive = archive.encodeToHex();
                }

                await s3.uploadBackup(rawArchive);

                break;
            }
        }

    }
}
