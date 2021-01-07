FROM node:14-alpine as builder
WORKDIR /home/node/app
COPY ./package*.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm prune --production

FROM node:14-alpine
WORKDIR /home/node/app
COPY --from=builder /home/node/app ./
EXPOSE 1234
CMD npm start
