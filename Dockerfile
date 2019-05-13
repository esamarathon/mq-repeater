FROM node:10 AS builder
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
COPY tsconfig.json ./
COPY --chown=node:node ./src ./src
USER node
# Install the npm deps including dev ones.
RUN npm install
# Build the code from the TypeScript source.
RUN npm run build
# Package built code into binary using pkg.
RUN npm run package

FROM debian
WORKDIR /repeater
COPY --from=builder /home/node/app/pkg/mq-repeater ./
CMD ./mq-repeater
