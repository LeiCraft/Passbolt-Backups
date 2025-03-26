
export class LinuxShellAPI {

    private static async exec(cmd: string) {
        try {
            const result = await Bun.$`${{ raw: cmd }}`.quiet();
            return { code: result.exitCode, data: result.text() };
        } catch {
            return { code: 1 } as const;
        }
    }

    private static async saveExec(cmd: string) {
        const result = await this.exec(cmd);
        if (result.code !== 0) {
            throw new Error(`Failed to execute command: ${cmd}`);
        }
        return result.data;
    }

    static async getFile(path: string) {
        return await this.saveExec(`cat ${path}`);
    }

    static async getEnv() {
        return await this.saveExec("printenv");;
    }

}