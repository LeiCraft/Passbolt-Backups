import { CLICMD, type CLICMDExecMeta } from "@cleverjs/cli";
import { S3Client } from "bun";

export class CreateBackupCMD extends CLICMD {
    readonly name = "create";
    readonly description = "Creates a backup of the Passbolt data and uploads it to the S3 bucket.";
    readonly usage = "create [--config=<path_to_env>]";

    run(args: string[], meta: CLICMDExecMeta): Promise<void> {
        throw new Error("Method not implemented.");
    }   
}
