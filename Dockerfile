FROM node:16-alpine as builder
WORKDIR /home/node/app
RUN npm install -g npm@latest
COPY ./package*.json ./
RUN npm ci
COPY . ./
RUN npm run build
RUN npm prune --production

FROM node:16-alpine
WORKDIR /home/node/app
COPY --from=builder /home/node/app ./
EXPOSE 1234
CMD npm start
