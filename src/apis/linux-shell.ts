import { ShellError, type ShellPromise } from "bun";
import { existsSync } from "fs";

export class LinuxShellAPI {

    static async handleExec(sp: ShellPromise) {
        try {
            const result = await sp.quiet();
            return result.text();
        } catch (e: any) {
            if (e.stderr) {
                throw new Error(`Failed to execute command \n${e.stderr}\n`);
            }
            throw new Error(`Failed to execute command`);
        }
    }

    static getFile(path: string) {
        if (!existsSync(path)) {
            throw new Error(`File ${path} does not exist`);
        }
        const promise = Bun.$`cat ${path}`;
        return this.handleExec(promise);
    }

    static delFile(path: string) {
        if (!existsSync(path)) {
            throw new Error(`File ${path} does not exist`);
        }
        const promise = Bun.$`rm ${path}`;
        return this.handleExec(promise);
    }

    static getEnv() {
        const promise = Bun.$`printenv`;
        return this.handleExec(promise);
    }

}