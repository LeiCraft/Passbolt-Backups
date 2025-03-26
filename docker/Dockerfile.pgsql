FROM passbolt/passbolt:latest-ce

COPY --chown=root:root ./build/bin/passbolt-backups-linux-x64-baseline /usr/local/bin/passbolt-backups
COPY --chown=root:root ./default.env /etc/passbolt-backups/default.env

RUN chmod +x /usr/local/bin/passbolt-backups

RUN apt-get install -y postgresql-client

