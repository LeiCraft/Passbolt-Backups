import { Uint, Uint16, Uint64 } from "low-level";

type FilePath = string;

type FileList = {
    [key: FilePath]: Uint;
}

export class SingleFile {

    constructor(
        readonly path: FilePath,
        readonly data: Uint
    ) {}

    public encodeToHex() {

        const encodedPath = Uint.from(this.path, "utf8");
        const pathLength = Uint16.from(encodedPath.getLen());

        const payloadLength = this.data.getLen("uint");
        // Length of the payload length prefix
        const payloadLengthPrefixLength = Uint16.from(payloadLength.getLen());
        
        return Uint.concat([
            pathLength,
            encodedPath,

            payloadLengthPrefixLength,
            payloadLength,
            this.data
        ]);
    }

    static fromDecodedHex(hex: Uint) {
        const lenCounter = Uint64.from(0);

        const pathLength = hex.slice(0, 2).toInt();
        lenCounter.iadd(2);
        const path = hex.slice(lenCounter.toInt(), lenCounter.toInt() + pathLength);
        lenCounter.iadd(pathLength);

        const payloadLengthPrefixLength = hex.slice(lenCounter.toInt(), lenCounter.toInt() + 2).toInt();
        lenCounter.iadd(2);

        const payloadLength = hex.slice(lenCounter.toInt(), lenCounter.toInt() + payloadLengthPrefixLength);
        lenCounter.iadd(payloadLengthPrefixLength);

        const data = hex.slice(lenCounter.toInt(), lenCounter.toInt() + payloadLength.toInt());
        lenCounter.iadd(payloadLength.toInt());

        return {
            data: new SingleFile(path.toString("utf8"), data),
            length: lenCounter.toInt()
        }
    }

}

export class BackupArchive {

    constructor(
        protected readonly files: SingleFile[]
    ) {

    }

    static fromFileList(files: FileList) {
        return new BackupArchive(
            Object.entries(files).map(([path, data]) => new SingleFile(path, data))
        );
    }


    public encodeToHex() {
        return Uint.from(this.files.map(file => file.encodeToHex()));
    }

    static fromDecodedHex(hex: Uint) {
        


    }

}
