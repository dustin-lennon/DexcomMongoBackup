# ================ #
#    Base Stage    #
# ================ #

FROM node:19-buster-slim as base

WORKDIR /opt/app

ENV HUSKY=0
ENV CI=true

RUN apt-get update && \
    apt-get upgrade -y --no-install-recommends && \
    apt-get install -y --no-install-recommends build-essential python3 libfontconfig1 dumb-init wget ca-certificates \
    libgssapi-krb5-2 libkrb5-3 libk5crypto3 libkrb5support0 libkeyutils1 p7zip-full && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian10-x86_64-100.6.1.deb -O /var/tmp/mongodb-tools.deb && \
    dpkg -i /var/tmp/mongodb-tools.deb && \
    rm /var/tmp/mongodb-tools.deb

COPY --chown=node:node yarn.lock .
COPY --chown=node:node package.json .
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node .yarn/ .yarn/

RUN sed -i 's/"prepare": "husky install\( .github\/husky\)\?"/"prepare": ""/' ./package.json

ENTRYPOINT ["dumb-init", "--"]

# ================ #
#   Builder Stage  #
# ================ #

FROM base as builder

ENV NODE_ENV="development"

COPY --chown=node:node tsconfig.base.json tsconfig.base.json
COPY --chown=node:node scripts/ scripts/
COPY --chown=node:node src/ src/

RUN yarn install --immutable
RUN yarn run build

# ================ #
#   Runner Stage   #
# ================ #

FROM base AS runner

ENV NODE_ENV="production"

# If you require additional NodeJS flags then specify them here
ENV NODE_OPTIONS="--enable-source-maps --max_old_space_size=4096"

COPY --chown=node:node scripts/workerTsLoader.js scripts/workerTsLoader.js
COPY --chown=node:node src/.env src/.env
COPY --chown=node:node --from=builder /opt/app/dist dist

RUN yarn workspaces focus --all --production
RUN chown node:node /opt/app

USER node

CMD [ "yarn", "run", "start" ]