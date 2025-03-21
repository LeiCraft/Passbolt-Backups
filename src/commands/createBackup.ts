import { CLICMD, type CLICMDExecMeta } from "@cleverjs/cli";
import { ConfigHandler } from "../configHandler";
import { BackupManager } from "../manager";


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

        switch (config.INSTALLATION_TYPE) {
            case "default": {

                throw new Error("Not implemented yet.");

                break;
            }
            case "docker": {

                const archive = BackupManager.createDockerBackup({
                    passboltContainerName: config.DOCKER_PASSBOLT_CONTAINER,
                    passboltEnvPath: config.DOCKER_POSSBOLT_ENV,
                    dbContainerName: config.DOCKER_DB_CONTAINER,
                    dbType: config.DOCKER_DB_TYPE,
                    dbEnvPath: config.DOCKER_DB_ENV
                } as any);

                break;
            }
        }

    }   
}
