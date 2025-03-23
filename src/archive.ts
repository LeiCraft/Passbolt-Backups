import { formatDate } from "date-fns/format";
import { BE, Container, DataEncoder } from "flexbuf";
import { Uint, Uint16, Uint64 } from "low-level";
import { AES256 } from "./crypto";

type FilePath = string;

type FileList = {
    [key: FilePath]: Uint | string;
}

export class SingleFile extends Container {

    constructor(
        readonly path: FilePath,
        readonly content: Uint
    ) {super()}

    protected static fromDict(obj: Dict<any>) {
        return new SingleFile(obj.path, obj.content);
    }

    protected static readonly encodingSettings: readonly DataEncoder[] = [
        BE.Str("path"),
        BE.Custom("content", {type: "prefix", val: "unlimited"})
    ]

}

export class BackupArchiveContent extends Container {
    constructor(
        readonly files: SingleFile[],
    ) {super()}

    protected static fromDict(obj: Dict<any>) {
        return new BackupArchiveContent(obj.files);
    }

    protected static readonly encodingSettings: readonly DataEncoder[] = [
        BE.Array("files", "unlimited", SingleFile)
    ]
}

export class BackupArchiveHeader extends Container {

    constructor(
        readonly time: Uint64,
        readonly version: Uint16 = Uint16.from(0)
    ) {super()}


    public getDateString() {
        return `${formatDate(Number(this.time.toBigInt()), "yyyy-MM-dd_HH-mm-ss")}`;
    }

    public getArchiveName() {
        return `passbolt-${this.getDateString()}.backup`;
    }


    protected static fromDict(obj: Dict<any>) {
        return new BackupArchiveHeader(obj.time, obj.version);
    }

    protected static readonly encodingSettings: readonly DataEncoder[] = [
        BE(Uint16, "version"),
        BE(Uint64, "time")
    ]

}

export class BackupArchive extends BackupArchiveHeader {

    constructor(
        time: Uint64,
        readonly content: BackupArchiveContent,
        version: Uint16 = Uint16.from(0)
    ) {super(time, version)}

    static fromFileList(time: Uint64, files: FileList) {
        return new BackupArchive(
            time,
            new BackupArchiveContent(
                Object.entries(files).map(([path, data]) => new SingleFile(
                    path,
                    data instanceof Uint ? data : Uint.from(data, "utf8")
                ))
            )
        );
    }

    public toHeader() {
        return new BackupArchiveHeader(
            this.time,
            this.version
        );
    }

    public toRaw() {
        return new RawBackupArchive(this.toHeader(), false, this.content.encodeToHex());
    }


    /**
     * Encrypts an backup archive
     * @param passphrase The passphrase to encrypt the backup archive
     */
    public encrypt(passphrase: string) {
        const encodedContent = this.content.encodeToHex();
        const encryptedContent = AES256.encrypt(encodedContent, passphrase);
        return new RawBackupArchive(this.toHeader(), true, encryptedContent);
    }
    
    /**
     * Encrypts an backup archive
     * @param data The encrypted data
     * @param passphrase The passphrase to decrypt the data. If data is not encrypted, this parameter is ignored.
     */
    static fromEncrypted(data: Uint, passphrase?: string) {
        const raw = RawBackupArchive.fromDecodedHex(data);
        if (!raw) return null;

        let decryptedRawContent: Uint;

        if (raw.encrypted) {
            if (!passphrase) return null;
            
            decryptedRawContent = AES256.decrypt(raw.content, passphrase) as Uint;
            if (!decryptedRawContent) return null;
        } else {
            decryptedRawContent = raw.content;
        }

        const content = BackupArchiveContent.fromDecodedHex(decryptedRawContent);
        if (!content) return null;
        return BackupArchive.fromHeaderAndContent(raw.header, content);
    }


    static fromHeaderAndContent(header: BackupArchiveHeader, content: BackupArchiveContent) {
        return new BackupArchive(header.time, content, header.version);
    }


    protected static fromDict(obj: Dict<any>) {
        return new BackupArchive(obj.time, obj.content, obj.version);
    }

    protected static readonly encodingSettings: readonly DataEncoder[] = [
        ...BackupArchiveHeader.encodingSettings,
        BE.Object("content", BackupArchiveContent)
    ]

}


export class RawBackupArchive extends Container {
    constructor(
        readonly header: BackupArchiveHeader,
        readonly encrypted: boolean,
        readonly content: Uint
    ) {super()}

    protected static fromDict(obj: Dict<any>) {
        return new RawBackupArchive(obj.header, obj.encrypted, obj.content);
    }

    protected static encodingSettings: readonly DataEncoder[] = [
        BE.Object("header", BackupArchiveHeader),
        BE.Bool("encrypted"),
        BE.Custom("content", {type: "prefix", val: "unlimited"})
    ]
}
