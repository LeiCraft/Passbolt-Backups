import { CLIApp, CMDFlag, CMDFlagsParser, type CLICMDExecMeta } from "@cleverjs/cli";
import { ConfigHandler } from "./configHandler";
import { CreateBackupCMD } from "./commands/createBackup";

class Main extends CLIApp {
    
    protected onInit(): void | Promise<void> {
        this.register(new CreateBackupCMD());
    }

    protected flagParser = new CMDFlagsParser({
        "--config": new CMDFlag("string", "Path to the configuration file", false, null),
    });

    protected async run_help(meta: CLICMDExecMeta): Promise<void> {
        console.log("Usage: passbolt-s3-backups [options] <command>");
        console.log("Options:");
        console.log("  --config <path_to_env>  Path to the env file, if there are not automatically set");
        super.run_help(meta);        
    }

    async run(args: string[], meta: CLICMDExecMeta) {

        const parsingResult = this.flagParser.parse(args, true);
        if (typeof parsingResult === "string") {
            console.error(parsingResult);
            return;
        }
        const flags = parsingResult.result;
        args = parsingResult.discarded;

        await ConfigHandler.parseConfigFile(flags["--config"]);

        super.run(args, meta);
    }

}


new Main("shell").handle(process.argv.slice(2));