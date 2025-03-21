import { Uint } from "low-level";
import { SingleFile } from "../src/archive.js";
import { describe, expect, test } from "bun:test"

describe("encoding_decoding", () => {

    test("SingleFile", () => {

        const file = new SingleFile("path/to/file.txt", Uint.from("one line\nanother line", "utf8"));

        const hex = file.encodeToHex();
        const decoded = SingleFile.fromDecodedHex(hex);

        expect(decoded.length).toBe(hex.getLen());

        expect(decoded.data.path).toBe("path/to/file.txt");
        expect(decoded.data.data.toString()).toBe("one line\nanother line");

    });


});

