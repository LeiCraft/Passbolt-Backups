
class Shell {
    static async run(cmd: string) {
        try {
            const result = await Bun.$`${{ raw: cmd }}`;
            return { code: result.exitCode, data: result.text() };
        } catch {
            return { code: 1 } as const;
        }
    }

    static async runInDocker(containerName: string, cmd: string, prefix = "") {
        if (prefix.length > 0) prefix = prefix + " ";
        return await Shell.run(prefix + `docker exec -i ${containerName} bash -c '${cmd}'`);
    }
}

export class BackupFetcher {

    static async getDockerDBDump(containerName: string, dbType: "mysql" | "postgres") {

        let result: { code: number; data?: string; } | null = null;
        
        if (dbType === "mysql") {
            result = await Shell.runInDocker(containerName, "mysqldump -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE}");
        } else if (dbType === "postgres") {
            result = await Shell.runInDocker('PGPASSWORD="${POSTGRES_PASSWORD}" ', 'pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"');
        }

        if (result?.code === 0 && result.data) {
            return result.data;
        }
        return null;
    }

    static async getDockerServerKeys(containerName: string) {

        const privateKey = await Shell.runInDocker(containerName, "cat /etc/passbolt/gpg/serverkey_private.asc");
        const publicKey = await Shell.runInDocker(containerName, "cat /etc/passbolt/gpg/serverkey.asc");

        if (privateKey.code === 0 && publicKey.code === 0) {
            return { privateKey: privateKey.data, publicKey: publicKey.data };
        }
        return null;
    }

    static async getFile(path: string) {
        const result = await Shell.run(`cat ${path}`);
        if (result.code === 0) {
            return result.data;
        }
        return null;
    }

}
