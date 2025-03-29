import { CLICMD, CLISubCMD } from "@cleverjs/cli";
import { Utils } from "../utils";

export class CronCMD extends CLISubCMD {

    readonly name = "cron";
    readonly description = "Cron job for automatic backup creation.";
    readonly usage = "cron (setup | delete) [--config=<path_to_env>] [...args]";

    protected onInit(): void | Promise<void> {

    }

}

class CronSetupCMD extends CLICMD {
    readonly name = "setup";
    readonly description = "Setup cron job for automatic backup creation.";
    readonly usage = "setup <cron_time> [--config=<path_to_env>]";

    async run(args: string[]) {
        console.log("Setting up cron job...");

        const result = await Utils.parseDefaultArgs(args);
        const config = result.config;
        args = result.args;

        if (args.length !== 2) {
            console.error("You have to specify the backup name and the destination directory.");
            process.exit(1);
        }
    }

}