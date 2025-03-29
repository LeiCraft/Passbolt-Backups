import { CLICMD, CLISubCMD } from "@cleverjs/cli";
import { Utils } from "../utils";
import { CronHelper } from "../apis/helper";

export class CronCMD extends CLISubCMD {

    readonly name = "cron";
    readonly description = "Cron job for automatic backup creation.";
    readonly usage = "cron (setup | delete) [--config=<path_to_env>] [...args]";

    protected onInit(): void | Promise<void> {
        this.register(new CronSetupCMD());
        this.register(new CronDeleteCMD());
    }

}

class CronSetupCMD extends CLICMD {
    readonly name = "setup";
    readonly description = "Setup cron job for automatic backup creation.";
    readonly usage = "setup [--config=<path_to_env>] <cron_time> [<bin_path>]";

    async run(args: string[]) {
        console.log("Setting up cron job...");

        const result = await Utils.parseDefaultArgs(args);
        const flags = result.flags;
        args = result.args;

        if (args.length > 2) {
            console.error("You have to specify the backup name and the destination directory.");
            process.exit(1);
        }

        const cronTime = args[0] || "0 0 * * *";
        const binPath = args[1] || "/usr/local/bin/passbolt-backups";

        const create_result = await CronHelper.createCronJob(cronTime, binPath, flags["--config"], true);

        if (create_result) {
            console.log("Cron job created successfully.");
        } else {
            console.error("Failed to create cron job.");
        }
    }

}

class CronDeleteCMD extends CLICMD {
    readonly name = "delete";
    readonly description = "Delete cron job for automatic backup creation.";
    readonly usage = "delete [--config=<path_to_env>]";

    async run(args: string[]) {
        console.log("Deleting cron job...");

        const result = await CronHelper.deleteCronJob();
        if (result) {
            console.log("Cron job deleted successfully.");
        } else {
            console.error("Failed to delete cron job.");
        }
    }

}
