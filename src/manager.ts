import { Uint64 } from "low-level";
import { BackupArchive } from "./archive";
import { BackupFetcher } from "./fetcher";

export class BackupManager {

    static async createDockerBackup(options: {
        passboltContainerName: string;
        dbContainerName: string;
        dbType: "mysql" | "postgres";
    } & ({
        liveEnv: false;
        passboltEnvPath: string;
        dbEnvPath: string;
    } | { liveEnv: true; })) {

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

        let passboltEnv: string | null;
        let dbEnv: string | null;

        if (options.liveEnv) {
            passboltEnv = await BackupFetcher.getDockerEnv(options.passboltContainerName);
            dbEnv = await BackupFetcher.getDockerEnv(options.dbContainerName);
        } else {
            passboltEnv = await BackupFetcher.getFile(options.passboltEnvPath);
            dbEnv = await BackupFetcher.getFile(options.dbEnvPath);
        }

        if (!passboltEnv) {
            console.error("Error getting the passbolt env configuration.");
            process.exit(1);
        }
        if (!dbEnv) {
            console.error("Error getting the database env configuration.");
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
