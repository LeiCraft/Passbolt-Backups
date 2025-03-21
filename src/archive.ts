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

export class BackupArchive extends Container {

    constructor(
        readonly time: Uint64,
        readonly files: SingleFile[],
        readonly version: Uint16 = Uint16.from(0)
    ) {super()}

    static fromFileList(time: Uint64, files: FileList) {
        return new BackupArchive(
            time, 
            Object.entries(files).map(([path, data]) => new SingleFile(path, data))
        );
    }

    public getDateString() {
        return `${formatDate(Number(this.time.toBigInt()), "yyyy-MM-dd_HH-mm-ss")}`;
    }

    public getArchiveName() {
        return `passbolt-${this.getDateString()}.backup`;
    }

    protected static fromDict(obj: Dict<any>) {
        return new BackupArchive(obj.time, obj.files, obj.version);
    }

    protected static readonly encodingSettings: readonly DataEncoder[] = [
        BE(Uint16, "version"),
        BE(Uint64, "time"),
        BE.Array("files", "unlimited", SingleFile)
    ]

}
