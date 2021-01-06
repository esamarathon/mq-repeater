FROM node:14
WORKDIR /home/node/app
COPY ./package*.json ./
RUN npm install
COPY . ./
RUN npm run build
RUN npm prune --production
EXPOSE 1234
CMD npm start
