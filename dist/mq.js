"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var amqp_connection_manager_1 = __importDefault(require("amqp-connection-manager")); // eslint-disable-line max-len
var amqplib_1 = __importDefault(require("amqplib"));
function buildMQURL(config) {
    var url = config.rabbitmq.protocol + "://" + config.rabbitmq.hostname;
    if (config.rabbitmq.vhost) {
        url += "/" + config.rabbitmq.vhost;
    }
    if (!config.rabbitmq.username && !config.rabbitmq.password) {
        return { url: url };
    }
    return {
        url: url,
        connectionOptions: {
            credentials: amqplib_1.default.credentials.plain(config.rabbitmq.username, config.rabbitmq.password),
        },
    };
}
function messageLog(exchange, key, data) {
    console.log('Sending to exchange %s, key %s: %s', exchange, key, data);
}
var MQ = /** @class */ (function () {
    function MQ(config) {
        console.log('RabbitMQ connecting...');
        this.mqConn = amqp_connection_manager_1.default.connect([buildMQURL(config)]).on('connect', function () {
            console.log('RabbitMQ server connection successful.');
        }).on('disconnect', function (err) {
            console.log('RabbitMQ server connection closed.');
            if (err) {
                console.log('RabbitMQ server connection error: ', err);
            }
        });
        this.mqChan = this.mqConn.createChannel({
            json: false,
            setup: function (chan) {
                var exchangeSettings = { durable: true, autoDelete: true };
                chan.assertExchange(config.rabbitmq.exchanges.tracker, 'topic', exchangeSettings);
                chan.assertExchange(config.rabbitmq.exchanges.moderation, 'topic', exchangeSettings);
            },
        }).on('error', function (err) {
            console.log('RabbitMQ server channel error: ', err);
        });
    }
    MQ.prototype.send = function (exchange, key, data) {
        var jsonData = JSON.stringify(data);
        this.mqChan.publish(exchange, key, Buffer.from(jsonData), { persistent: true });
        messageLog(exchange, key, jsonData);
    };
    return MQ;
}());
exports.MQ = MQ;
