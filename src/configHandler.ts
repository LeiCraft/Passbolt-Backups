import dotenv from "dotenv";

type ConfigSchemaSettings = {
    [key: string]: boolean;
}

type ConfigLike<T extends ConfigSchemaSettings> = {
    [K in keyof T]: T[K] extends true ? string : string | undefined;
}

class ConfigSchema<T extends ConfigSchemaSettings = {}> {

    private schema: Dict<boolean> = {};

    public add<KEY extends string, REQUIRED extends boolean>(key: KEY, required: REQUIRED) {
        this.schema[key] = required;
        return this as ConfigSchema<T & { [K in KEY]: REQUIRED }>;
    }

    public validateAndParse() {
        const result: ConfigLike<T> = {} as ConfigLike<T>;

        for (const [key, required] of Object.entries(this.schema)) {
            if (!process.env[key]) {
                if (required) {
                    console.error(`The environment variable ${key} is required but not set.`);
                    process.exit(1);
                }
                continue;
            }
            (result[key] as any) = process.env[key];
        }

        return result;
    }

}

export class ConfigHandler {

    private static schema = new ConfigSchema()
        .add("S3_ENDPOINT", true)
        .add("S3_ACCESS_KEY_ID", true)
        .add("S3_SECRET_ACCESS_KEY", true)
        .add("S3_BUCKET", false)
        .add("S3_BASE_PATH", false);

    private static config: ReturnType<typeof ConfigHandler.schema.validateAndParse> | null = null;

    /** You have to call {@link ConfigHandler.parseConfigFile} before trying to access the config. */
    static getConfig() {
        return this.config;
    }

    private static async loadEnvWithoutOverwrite(file: string) {
        try {
            const content = await Bun.file(file).text();
            const env = dotenv.parse(content);
        
            for (const key in env) {
                if (!process.env[key]) {
                    process.env[key] = env[key];
                }
            }
        } catch (e: any) {
            console.error(`Error reading the env file: ${e.message}`);
            process.exit(1);
        }
    }

    static async parseConfigFile(file?: string | null) {
        if (this.config) return this.config;

        if (file) {
            await this.loadEnvWithoutOverwrite(file);
        }

        this.config = this.schema.validateAndParse();
        return this.config;
    }

}
