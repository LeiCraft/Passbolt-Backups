import { CLIApp, type CLICMDExecMeta } from "@cleverjs/cli";
import { CreateBackupCMD } from "./commands/createCMD";
import { DownloadBackupCMD } from "./commands/downloadCMD";

class Main extends CLIApp {
    
    protected onInit(): void | Promise<void> {
        this.register(new CreateBackupCMD());
        this.register(new DownloadBackupCMD());
    }

    protected async run_help(meta: CLICMDExecMeta): Promise<void> {
        console.log("Usage: passbolt-backups <command> [options]");
        console.log("Options:");
        console.log("  --config=<path_to_env>  Path to the env file, if there are not automatically set");
        super.run_help(meta);
    }

}


new Main("shell").handle(process.argv.slice(2));
