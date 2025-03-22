import dotenv from "dotenv";

interface ConfigSchemaSetting<
    REQUIRED extends ConfigSchemaSetting.Required,
    TYPE extends ConfigSchemaSetting.Type = undefined,
    DEPENDENCIES extends ConfigSchemaSetting.Dependencies = undefined
> {
    required: REQUIRED;
    type?: TYPE;
    dependencies?: DEPENDENCIES;
}

namespace ConfigSchemaSetting {
    export type Required = boolean;
    export type Type = string[] | undefined;
    export type Dependencies = Record<string, string[]> | undefined;
    export type Sample = ConfigSchemaSetting<Required, Type, Dependencies>;
}

type ConfigValueType<
    T extends ConfigSchemaSetting.Sample,
    F = [T] extends [ConfigSchemaSetting<any, infer U, any>]
    ? U extends string[]
        ? U[number]
        : string
    : string
> = T["required"] extends true ? F : F | undefined;

interface ConfigSchemaSettings {
    [key: string]: ConfigSchemaSetting.Sample;
}

type ConfigLike<T extends ConfigSchemaSettings> = {
    [K in keyof T]: ConfigValueType<T[K]>;
}

class ConfigSchema<T extends ConfigSchemaSettings = {}> {

    readonly schema: T = {} as any;

    public add<
        KEY extends string,
        Setings extends ConfigSchemaSetting<ISREQUIRED, TYPE, DEPENDENCIES>,
        ISREQUIRED extends boolean,
        const TYPE extends ConfigSchemaSetting.Type = undefined,
        const DEPENDENCIES extends ConfigSchemaSetting.Dependencies = undefined
    >(
        key: KEY,
        required = false as ISREQUIRED,
        type?: TYPE,
        dependencies?: DEPENDENCIES
    ) {
        (this.schema as any)[key] = { required, type, dependencies };
        return this as any as ConfigSchema<T & { [K in KEY]: Setings }>;
    }

    public parse() {
        const result: ConfigLike<T> = {} as ConfigLike<T>;

        for (const [key, settings] of Object.entries(this.schema)) {

            if (!process.env[key]) {
                if (settings.required) {
                    console.error(`The environment variable ${key} is required but not set.`);
                    process.exit(1);
                }
                continue;
            }

            (result[key] as any) = process.env[key];

            if (settings.type && !settings.type.includes(process.env[key].toLowerCase())) {
                console.error(`The environment variable ${key} has to be one of the following: ${settings.type.join(", ")}`);
                process.exit(1);
            }

            if (settings.dependencies) {
                const dependencies = settings.dependencies[process.env[key]];
                if (!dependencies) continue;

                for (const dep of dependencies) {
                    if (!process.env[dep]) {
                        console.error(`The environment variable ${dep} is required by ${key} but not set.`);
                        process.exit(1);
                    }
                }
            }
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

        .add("INSTALLATION_TYPE", true, ["default", "docker"], {
            "default": ["WEB_SERVER_USER", "CAKE_BIN", "GPG_SERVER_PRIVATE_KEY", "GPG_SERVER_PUBLIC_KEY", "PASSBOLT_CONFIG_FILE"],
            "docker": ["DOCKER_PASSBOLT_CONTAINER", "DOCKER_DB_CONTAINER", "DOCKER_DB_TYPE", "DOCKER_LIVE_ENV"]
        })

        .add("WEB_SERVER_USER", false)
        .add("CAKE_BIN", false)
        .add("GPG_SERVER_PRIVATE_KEY", false)
        .add("GPG_SERVER_PUBLIC_KEY", false)
        .add("PASSBOLT_CONFIG_FILE", false)

        .add("DOCKER_PASSBOLT_CONTAINER", false)
        .add("DOCKER_DB_CONTAINER", false)
        .add("DOCKER_DB_TYPE", false, ["mysql", "postgres"])

        .add("DOCKER_LIVE_ENV", false, ["true", "false"], {
            "false": ["DOCKER_POSSBOLT_ENV", "DOCKER_DB_ENV"]
        })
        .add("DOCKER_POSSBOLT_ENV", false)
        .add("DOCKER_DB_ENV", false)

        .add("ENCRYPTION_PASSPHRASE", false);
        

    private static config: ConfigLike<typeof this.schema.schema> | null = null;

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

        return this.config = this.schema.parse();
    }

}
