import { CLIApp, CMDFlag, CMDFlagsParser, type CLICMDExecMeta } from "@cleverjs/cli";

class Main extends CLIApp {
    
    protected onInit(): void | Promise<void> {}

    protected flagParser = new CMDFlagsParser({
        "--config": new CMDFlag("string", "Path to the configuration file", false, null),
    });

    protected async run_help(meta: CLICMDExecMeta): Promise<void> {
        console.log("Usage: passbolt-s3-backups [options] <command>");
        console.log("Options:");
        console.log("  --config <path>  Path to the configuration file. Alternatively, you can use Environment Variables to set the configuration.");
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

        if (flags["--config"]) {
            try {
                const file = await Bun.file(flags["--config"]).json();
            } catch (e: any) {
                console.error(`Error reading the configuration file: ${e.message}`);
                return;
            }
        }

        super.run(args, meta);
    }

}


new Main("shell").handle(process.argv.slice(2));