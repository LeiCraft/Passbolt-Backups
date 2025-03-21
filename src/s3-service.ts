import { S3Client } from "bun";
import type { BackupArchive } from "./archive";

export class S3Service {

    protected readonly client: S3Client;
    protected readonly basePath: string = "";

    /**
     * Constructs a new instance of the `S3Service` class.
     *
     * @param options - Configuration options for the S3Service.
     * @param options.endpoint - The endpoint URL of the S3-compatible storage service.
     * @param options.accessKeyId - The access key ID for authentication with the storage service.
     * @param options.secretAccessKey - The secret access key for authentication with the storage service.
     * @param options.bucket - (Optional) The name of the bucket to use for storing backups.
     * @param options.basePath - (Optional) The base path within the bucket where backups will be stored. Should be in format `path/to/folder/`.
     */
    constructor(options: {
        endpoint: string,
        accessKeyId: string,
        secretAccessKey: string,
        bucket?: string,
        basePath?: string
    }) {
        this.client = new S3Client(options);

        if (options.basePath) {
            if (!options.basePath.endsWith("/")) {
                options.basePath = options.basePath + "/";
            }
            if (options.basePath.startsWith("/")) {
                options.basePath = options.basePath.replace(/^\//, "");
            }
            if (options.basePath.length > 0) {
                this.basePath = options.basePath;
            }
        }
    }

    async uploadBackup(data: BackupArchive) {
        return await this.client.write(`${this.basePath + new Date().toUTCString()}.backup`, data.encodeToHex().getRaw());
    }
}
