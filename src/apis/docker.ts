async function readDockerRawStream(response: Response): Promise<{ stdout: string; stderr: string }> {
    if (!response.body) throw new Error("Response body is null");

    const reader = response.body.getReader();
    let buffer = new Uint8Array(0);
    let stdout = "";
    let stderr = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new data to buffer
        const newBuffer = new Uint8Array(buffer.length + value.length);
        newBuffer.set(buffer);
        newBuffer.set(value, buffer.length);
        buffer = newBuffer;

        // Process frames
        while (buffer.length >= 8) {
            // Read header
            const streamType = buffer[0]; // 0 = stdin, 1 = stdout, 2 = stderr
            const frameSize = new DataView(buffer.buffer, buffer.byteOffset + 4, 4).getUint32(0, false); // Big endian

            // Check if the full frame is available
            if (buffer.length < 8 + frameSize) break;

            // Extract payload
            const payload = buffer.slice(8, 8 + frameSize);
            buffer = buffer.slice(8 + frameSize); // Remove processed data from buffer

            // Decode and store the output
            const output = new TextDecoder().decode(payload);
            if (streamType === 1) {
                stdout += output;
            } else if (streamType === 2) {
                stderr += output;
            }
        }
    }

    return { stdout: stdout.trimEnd(), stderr: stderr.trimEnd() };
}

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

        return (await readDockerRawStream(startExec)).stdout;
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

}

