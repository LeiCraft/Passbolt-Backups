import type { ShellPromise } from "bun";
import { existsSync } from "fs";

export class LinuxShellAPI {

    static async handleExec(sp: ShellPromise) {
        const result = await sp.quiet();
        if (result.exitCode !== 0) {
            throw new Error(`Failed to execute command`);
        }
        return result.text();
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