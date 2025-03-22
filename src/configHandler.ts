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

    public parse() {
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
        .add("S3_BASE_PATH", false)

        .add("INSTALLATION_TYPE", true)

        .add("WEB_SERVER_USER", false)
        .add("CAKE_BIN", false)
        .add("GPG_SERVER_PRIVATE_KEY", false)
        .add("GPG_SERVER_PUBLIC_KEY", false)
        .add("PASSBOLT_CONFIG_FILE", false)

        .add("DOCKER_PASSBOLT_CONTAINER", false)
        .add("DOCKER_DB_CONTAINER", false)
        .add("DOCKER_DB_TYPE", false)
        .add("DOCKER_POSSBOLT_ENV", false)
        .add("DOCKER_DB_ENV", false)
        .add("DOCKER_LIVE_ENV", false)

        .add("ENCRYPTION_PASSPHRASE", false);
        

    private static config: (
        ReturnType<typeof ConfigHandler.schema.parse>
    ) | null = null;

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

        const config = this.schema.parse();

        if (config.INSTALLATION_TYPE.toLowerCase() === "default") {

            const hasStandardConfig = !!config.WEB_SERVER_USER &&
                                      !!config.CAKE_BIN &&
                                      !!config.GPG_SERVER_PRIVATE_KEY &&
                                      !!config.GPG_SERVER_PUBLIC_KEY &&
                                      !!config.PASSBOLT_CONFIG_FILE;

            if (!hasStandardConfig) {
                console.error("The standard configuration for INSTALLATION_TYPE 'default' is not complete.");
                process.exit(1);
            }
        } else if (config.INSTALLATION_TYPE.toLowerCase() === "docker") {

            const hasDockerConfig = !!config.DOCKER_PASSBOLT_CONTAINER && !!config.DOCKER_DB_CONTAINER;

            if (config.DOCKER_DB_TYPE?.toLowerCase() !== "mysql" && config.DOCKER_DB_TYPE?.toLowerCase() !== "postgres") {
                console.error("The DOCKER_DB_TYPE has to be either 'mysql' or 'postgres'.");
                process.exit(1);
            }

            if (config.DOCKER_LIVE_ENV?.toLowerCase() === "false") {
                if (!config.DOCKER_POSSBOLT_ENV || !config.DOCKER_DB_ENV) {
                    console.error("The DOCKER_POSSBOLT_ENV and DOCKER_DB_ENV have to be set when DOCKER_LIVE_ENV is 'false'.");
                    process.exit(1);
                }
            } else if (config.DOCKER_LIVE_ENV?.toLowerCase() !== "true") {
                console.error("The DOCKER_LIVE_ENV has to be either 'true' or 'false'.");
                process.exit(1);
            }

            if (!hasDockerConfig) {
                console.error("The docker configuration for INSTALLATION_TYPE 'docker' is not complete.");
                process.exit(1);
            }
        } else {
            console.error("The INSTALLATION_TYPE has to be either 'default' or 'docker'.");
            process.exit(1);
        }
        this.config = config;
        return this.config;
    }

}
