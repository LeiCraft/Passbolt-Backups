import { CMDFlag, CMDFlagsParser } from "@cleverjs/cli";
import { ConfigHandler } from "./configHandler.js";


export class Utils {

    static async parseDefaultArgs(args: string[]) {

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

        return await ConfigHandler.parseConfigFile(flags["--config"]);
    }
    
}
