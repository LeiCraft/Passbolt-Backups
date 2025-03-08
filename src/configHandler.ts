
export interface IConfig {
    s3_endpoint: string;
    s3_access_key_id: string;
    s3_secret_access_key: string;
    s3_bucket: string;
}

export class ConfigHandler {

    private static config: IConfig;

}
