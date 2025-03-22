
export class LinuxShellAPI {

    static async exec(cmd: string) {
        try {
            const result = await Bun.$`${{ raw: cmd }}`.quiet();
            return { code: result.exitCode, data: result.text() };
        } catch {
            return { code: 1 } as const;
        }
    }

    static async getFile(path: string) {
        const result = await this.exec(`cat ${path}`);
        if (result.code === 0) {
            return result.data;
        }
        return null;
    }

}