import { CLICMD, type CLICMDExecMeta } from "@cleverjs/cli";
import { ConfigHandler } from "../configHandler";
import { BackupManager } from "../manager";
import { S3Service } from "../s3-service";


export class CreateBackupCMD extends CLICMD {
    readonly name = "create";
    readonly description = "Creates a backup of the Passbolt data and uploads it to the S3 bucket.";
    readonly usage = "create [--config=<path_to_env>]";

    async run(args: string[], meta: CLICMDExecMeta) {
        
        const config = ConfigHandler.getConfig();
        if (!config) {
            console.error("Error: Configuration not loaded.");
            process.exit(1);
        }

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

                await s3.uploadBackup(archive);

                break;
            }
        }

    }
}
