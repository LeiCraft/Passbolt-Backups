
export class DockerAPI {

    /**
     * 
     * @param baseurl base url of the docker api Eg: http://localhost or http://localhost/v1.48
     */
    constructor(
        protected readonly baseurl= "http://localhost",
        protected readonly unix: string = "/var/run/docker.sock"
    ) {
        if (!this.baseurl.startsWith("http")) {
            throw new Error("Invalid base url");
        }
        if (this.baseurl.endsWith("/")) {
            this.baseurl.slice(0, -1);
        }
    }

    protected async fetch(url: string, options: {
        method?: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
        body?: Record<any, any>;
        headers?: Record<string, string>;
    }) {
        return await fetch(this.baseurl + url, {
            unix: this.unix,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            method: options.method,
            body: JSON.stringify(options.body),
        } as BunFetchRequestInit);
    }
    	
    /**
     * 
     * @param container id or name of the container
     * @param cmd array of command and arguments to execute
     */
    async exec(container: string, cmd: string) {
        const createExec = await this.fetch("/containers/" + container + "/exec", {
            method: "POST",
            body: {
                AttachStdin: false,
                AttachStdout: true,
                AttachStderr: true,
                //Tty: true,
                Cmd: ["bash", "-c", cmd],
                Env: [
                    "LANG=C.UTF-8"
                ]
            }
        });
        const { Id: execId } = await createExec.json() as { Id: string; };
        if (!execId) {
            throw new Error("Error creating exec instance");
        }

        const startExec = await this.fetch("/exec/" + execId + "/start", {
            method: "POST",
            body: {
                Detach: false,
                //Tty: true
            }
        });
        if (startExec.status !== 200) {
            throw new Error("Error starting exec instance");
        }
        
        // const rawOutput = await startExec.arrayBuffer();
        // const buffer = Buffer.from(rawOutput);

        // // Strip the first 8 bytes (Docker's frame header)
        // const cleanedBuffer = buffer.subarray(8);

        // // Explicitly decode as UTF-8 and remove non-printable characters
        // return cleanedBuffer.toString("utf-8").replace(/\uFFFD/g, ""); // Remove unknown characters


        const reader = startExec.body?.getReader();
        if (!reader) return;

        const chunks: Uint8Array[] = [];
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Strip Docker's 8-byte headers
            let i = 0;
            while (i < value.length) {
                const streamType = value[i]; // 1 = stdout, 2 = stderr
                const frameSize = (value[i + 4] << 24) | (value[i + 5] << 16) | (value[i + 6] << 8) | value[i + 7]; // Extract frame length
                i += 8; // Skip header

                if (i + frameSize > value.length) break; // Safety check

                chunks.push(value.slice(i, i + frameSize)); // Store the chunk
                i += frameSize;
            }
        }

        // Decode the entire buffer in one go (more efficient)
        const output = decoder.decode(new Uint8Array(chunks.reduce((acc, chunk) => acc.concat(Array.from(chunk)), [])));

        return output;
    }

    /*private static async runInDocker(containerName: string, cmd: string, prefix = "") {
        if (prefix.length > 0) prefix = prefix + " ";
        return await this.exec(prefix + `docker exec -i ${containerName} bash -c '${cmd}'`);
    }*/

    async getDockerDBDump(containerName: string, dbType: "mysql" | "postgres") {
        switch (dbType) {
            case "mysql":
                return await this.exec(containerName, "mysqldump -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE}");

            case "postgres":
                return await this.exec('PGPASSWORD="${POSTGRES_PASSWORD}" ', 'pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"');
        }
    }

    async getDockerServerKeys(containerName: string) {
        return {
            privateKey: await this.exec(containerName, "cat /etc/passbolt/gpg/serverkey_private.asc"),
            publicKey: await this.exec(containerName, "cat /etc/passbolt/gpg/serverkey.asc")
        };
    }

    async getDockerEnv(containerName: string) {
        return await this.exec(containerName, "printenv");
    }

}

