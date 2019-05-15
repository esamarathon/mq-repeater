FROM node:10 AS builder
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node . .
# Build the code from the TypeScript source.
# Package built code into binary using pkg.
RUN npm run build && npm run package

FROM debian
RUN adduser --disabled-password --gecos '' appuser
USER appuser
WORKDIR /home/appuser/app
COPY --from=builder /home/node/app/pkg/mq-repeater ./
EXPOSE 1234
CMD ./mq-repeater
