import amqpConnectionManager, { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import amqplib from 'amqplib';
import { Config } from './config';


function buildMQURL(config: Config) {
  let url = `${config.rabbitmq.protocol}://${config.rabbitmq.hostname}`;

  if (config.rabbitmq.vhost) {
    url += `/${config.rabbitmq.vhost}`;
  }

  if (!config.rabbitmq.username && !config.rabbitmq.password) {
    return { url } as any;
  }

  return {
    url, connectionOptions: {
      credentials: amqplib.credentials.plain(
        config.rabbitmq.username as string,
        config.rabbitmq.password as string,
      ),
    },
  } as any;

}

function messageLog(exchange: string, key: string, data: string) {
  console.log('Sending to exchange %s, key %s: %s', exchange, key, data);
}


export class MQ {
  mqConn: AmqpConnectionManager;
  mqChan: ChannelWrapper;

  constructor(config: Config) {
    console.log('RabbitMQ connecting...');
    this.mqConn = amqpConnectionManager.connect(
      [buildMQURL(config)],
    ).on('connect', () => {
      console.log('RabbitMQ server connection successful.');
    }).on('disconnect', (err) => {
      console.log('RabbitMQ server connection closed.');
      if (err) {
        console.log('RabbitMQ server connection error: ', err);
      }
    });
    this.mqChan = this.mqConn.createChannel({
      json: false,
      setup(chan: amqplib.ConfirmChannel) {
        const exchangeSettings = { durable: true, autoDelete: true };

        chan.assertExchange(config.rabbitmq.exchanges.tracker, 'topic', exchangeSettings);
        chan.assertExchange(config.rabbitmq.exchanges.moderation, 'topic', exchangeSettings);

        return;
      },
    }).on('error', (err) => {
      console.log('RabbitMQ server channel error: ', err);
    });
  }

  send(exchange: string, key: string, data: object) {
    const jsonData: string = JSON.stringify(data);

    this.mqChan.publish(
      exchange,
      key,
      Buffer.from(jsonData),
      { persistent: true },
    );

    messageLog(exchange, key, jsonData);
  }
}