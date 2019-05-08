import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import fsExtra from 'fs-extra';
import amqplib from 'amqplib';

// Load config if possible.
const config = fsExtra.readJSONSync('./config.json', { throws: false });
if (!config) {
  console.log('You have forgotten the config.json file.');
  process.exit();
}

// Set up HTTP server.
console.log('HTTP server starting...');
const app = express();
const server = new http.Server(app);
app.use(bodyParser);
server.listen(config.http.port);
console.log(`HTTP server listening on port ${config.http.port}.`);

console.log('RabbitMQ connecting...');
const mqConn = amqplib.connect(config.rabbitmq);
mqConn.then(() => {
  console.log('RabbitMQ remote server connection successful.');
}).catch((err) => {
  console.log('RabbitMQ remote server connection error: ', err);
});
