import { formatDate } from "date-fns/format";
import { BE, Container, DataEncoder } from "flexbuf";
import { Uint, Uint16, Uint64 } from "low-level";

type FilePath = string;

type FileList = {
    [key: FilePath]: Uint;
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

export class BackupArchiveHeader extends Container {

    constructor(
        readonly time: Uint64,
        public encrypted: boolean = false,
        readonly version: Uint16 = Uint16.from(0)
    ) {super()}

    protected static fromDict(obj: Dict<any>) {
        return new BackupArchive(obj.time, obj.encrypted, obj.version);
    }

    protected static readonly encodingSettings: readonly DataEncoder[] = [
        BE(Uint16, "version"),
        BE.Bool("encrypted"),
        BE(Uint64, "time")
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

export class BackupArchive extends BackupArchiveHeader {

    constructor(
        time: Uint64,
        readonly content: BackupArchiveContent,
        encrypted: boolean,
        version: Uint16 = Uint16.from(0)
    ) {super(time, encrypted, version)}

    static fromFileList(time: Uint64, files: FileList) {
        return new BackupArchive(
            time,
            new BackupArchiveContent(
                Object.entries(files).map(([path, data]) => new SingleFile(path, data))
            ),
            false,
        );
    }

    public getDateString() {
        return `${formatDate(Number(this.time.toBigInt()), "yyyy-MM-dd_HH-mm-ss")}`;
    }

    public getArchiveName() {
        return `passbolt-${this.getDateString()}.backup`;
    }

    protected static fromDict(obj: Dict<any>) {
        return new BackupArchive(obj.time, obj.content, obj.encrypted, obj.version);
    }

    protected static readonly encodingSettings: readonly DataEncoder[] = [
        ...BackupArchiveHeader.encodingSettings,
        BE.Object("content", BackupArchiveContent)
    ]

}
