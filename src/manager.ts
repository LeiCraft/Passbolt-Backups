import { Uint64 } from "low-level";
import { BackupArchive } from "./archive";
import { BackupFetcher } from "./fetcher";

export class BackupManager {

    static async createDockerBackup(options: {
        passboltContainerName: string;
        passboltEnvPath: string;
        dbContainerName: string;
        dbType: "mysql" | "postgres";
        dbEnvPath: string;
    }) {

        const dbDump = await BackupFetcher.getDockerDBDump(options.dbContainerName, options.dbType);
        if (!dbDump) {
            console.error("Error getting the database dump.");
            process.exit(1);
        }

        const serverKeys = await BackupFetcher.getDockerServerKeys(options.passboltContainerName);
        if (!serverKeys) {
            console.error("Error getting the server keys.");
            process.exit(1);
        }

        const passboltEnv = await BackupFetcher.getFile(options.passboltEnvPath);
        if (!passboltEnv) {
            console.error("Error getting the passbolt env file.");
            process.exit(1);
        }

        const dbEnv = await BackupFetcher.getFile(options.dbEnvPath);
        if (!dbEnv) {
            console.error("Error getting the database env file.");
            process.exit(1);
        }

        const archive = BackupArchive.fromFileList(Uint64.from(Date.now()), {
            "db/dump.sql": dbDump,
            "gpg/serverkey_private.asc": serverKeys.privateKey,
            "gpg/serverkey.asc": serverKeys.publicKey,
            "env/passbolt.env": passboltEnv,
            "env/db.env": dbEnv
        });

        return archive;

    }


}
