import { Uint64 } from "low-level";
import { BackupArchive } from "./archive";
import { DockerAPI } from "./apis/docker";
import { LinuxShellAPI } from "./apis/linux-shell";

namespace BackupManagerTypes {
    namespace Docker {
        // Base type without DB
        export interface Base {
            passboltContainerName: string;
            withDB: false;
            liveEnv: boolean;
        }

        // Base type with DB (strict enforcement of db properties)
        export interface BaseWithDB {
            passboltContainerName: string;
            withDB: true;
            dbContainerName: string;
            dbType: "mysql" | "postgres";
        }

        // Live Environment - Applies to both Base and BaseWithDB
        export type WithLiveEnv<T extends Base | BaseWithDB> = T & {
            liveEnv: true;
            passboltEnvPath: undefined;
        } & (T extends BaseWithDB ? { dbEnvPath: undefined } : {});

        // Environment Paths - Applies to both Base and BaseWithDB
        export type WithEnvPaths<T extends Base | BaseWithDB> = T & {
            liveEnv: false;
            passboltEnvPath: string;
        } & (T extends BaseWithDB ? { dbEnvPath: string } : {});
    }
    // Union type covering all possible valid structures
    export type Docker =
        | Docker.WithLiveEnv<Docker.Base>
        | Docker.WithLiveEnv<Docker.BaseWithDB>
        | Docker.WithEnvPaths<Docker.Base>
        | Docker.WithEnvPaths<Docker.BaseWithDB>;
}

export class BackupManager {

    static async createDockerBackup(options: BackupManagerTypes.Docker) {

        const dockerapi = new DockerAPI();
        
        let passboltEnv: string | null;
        let dbEnv: string | null;

        const files: Record<string, any> = {};

        if (options.withDB) {
            const dbDump = await dockerapi.getDockerDBDump(options.dbContainerName, options.dbType);
            if (!dbDump) {
                console.error("Error getting the database dump.");
                process.exit(1);
            }
            if (options.liveEnv) {
                dbEnv = await dockerapi.getDockerEnv(options.dbContainerName);
            } else {
                dbEnv = await LinuxShellAPI.getFile(options.dbEnvPath);
            }
            if (!dbEnv) {
                console.error("Error getting the database env configuration.");
                process.exit(1);
            }
            files["db/dump.sql"] = dbDump;
            files["env/db.env"] = dbEnv;
        }

        const serverKeys = await dockerapi.getDockerServerKeys(options.passboltContainerName);
        if (!serverKeys) {
            console.error("Error getting the server keys.");
            process.exit(1);
        }

        if (options.liveEnv) {
            passboltEnv = await dockerapi.getDockerEnv(options.passboltContainerName);
        } else {
            passboltEnv = await LinuxShellAPI.getFile(options.passboltEnvPath);
        }

        if (!passboltEnv) {
            console.error("Error getting the passbolt env configuration.");
            process.exit(1);
        }


        files["gpg/serverkey_private.asc"] = serverKeys.privateKey;
        files["gpg/serverkey.asc"] = serverKeys.publicKey;
        files["env/passbolt.env"] = passboltEnv;

        return BackupArchive.fromFileList(Uint64.from(Date.now()), files);;

    }


}
