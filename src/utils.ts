import { CMDFlag, CMDFlagsParser } from "@cleverjs/cli";
import { ConfigHandler, type ParsedConfig } from "./configHandler.js";

export class Utils {

    static async parseDefaultArgs(args: string[], parent_args: string[] = []): Promise<{ args: string[], config: ParsedConfig }> {

        const flagParser = new CMDFlagsParser({
            "--config": new CMDFlag("string", "Path to the configuration file", false, null),
        });

        const parsingResult = flagParser.parse(args, true);
        if (typeof parsingResult === "string") {
            console.error(parsingResult);
            process.exit(1);
        }
        const flags = parsingResult.result;
        args = parsingResult.discarded;

        return {
            args,
            config: await ConfigHandler.parseConfigFile(flags["--config"])
        };
    }
    
}
