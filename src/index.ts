import amqplib from 'amqplib';
import bodyParser from 'body-parser';
import express from 'express';
import fsExtra from 'fs-extra';
import http from 'http';
import path from 'path';

interface Config {
  http: {
    port: number;
    key: string | undefined;
  };
  rabbitmq: {
    protocol: string;
    hostname: string | undefined;
    username: string | undefined;
    password: string | undefined;
    vhost: string | undefined;
  };
}

// Configs!
const confFile: Config = fsExtra.readJSONSync(
  path.join(process.cwd(), './config.json'),
  { throws: false },
) || <Config>{ http: {}, rabbitmq: {} };
const env = process.env;
const envPort = (
  env.HTTP_PORT && !isNaN(parseInt(env.HTTP_PORT, 0))
  ) ? parseInt(env.HTTP_PORT, 0) : undefined;
const config: Config = {
  http: {
    port: envPort || confFile.http.port || 1234,
    key: env.HTTP_KEY || confFile.http.key,
  },
  rabbitmq: {
    protocol: env.RABBITMQ_PROTOCOL || confFile.rabbitmq.protocol || 'amqps',
    hostname: env.RABBITMQ_HOSTNAME || confFile.rabbitmq.hostname,
    username: env.RABBITMQ_USERNAME || confFile.rabbitmq.username,
    password: env.RABBITMQ_PASSWORD || confFile.rabbitmq.password,
    vhost: env.RABBITMQ_VHOST || confFile.rabbitmq.vhost,
  },
};

// Set up HTTP server.
console.log('HTTP server starting...');
const app = express();
const server = new http.Server(app);
app.use(bodyParser.json());
server.listen(config.http.port);
console.log(`HTTP server listening on port ${config.http.port}.`);

console.log('RabbitMQ connecting...');
const mqConn = amqplib.connect(config.rabbitmq);
let mqChan: amqplib.Channel;
mqConn.then((conn) => {
  console.log('RabbitMQ server connection successful.');
  conn.createChannel().then((chan) => {
    mqChan = chan;
    chan.assertQueue('evt-donation-total');
    chan.assertQueue('donation-fully-processed');
    chan.assertQueue('new-screened-tweet');
    chan.assertQueue('new-screened-sub');
  }).catch(logRabbitMQErrors);
}).catch(logRabbitMQErrors);

function logRabbitMQErrors(err: any) {
  console.log('RabbitMQ server connection error: ', err);
}

// A GET in case you need to check the server is running.
app.get('/', (req, res) => {
  res.send('Running OK');
});

// Tracker POSTs to here.
app.post('/tracker', (req, res) => {
  // Reject POSTs without the correct key.
  if (config.http.key && req.query.key !== config.http.key) {
    res.sendStatus(403);
    return;
  }

  // Donation pushes, from when they are approved to be shown on stream.
  if (req.body.message_type === 'donation_push') {
    // Remove the comment if it wasn't approved.
    if (req.body.comment_state !== 'APPROVED') {
      req.body.comment = '';
    }

    // When a donation has either been read or ignored/denied.
    send('donation-fully-processed', {
      event: req.body.event,
      _id: req.body.id,
      donor_visiblename: req.body.donor_visiblename,
      amount: parseFloat(req.body.amount),
      comment_state: req.body.comment_state,
      comment: req.body.comment,
      time_received: req.body.time_received,
    });
  }

  // Donation total change, when the total goes up when a payment is confirmed.
  if (req.body.message_type === 'donation_total_change') {
    send('evt-donation-total', {
      event: req.body.event,
      new_total: parseFloat(req.body.new_total),
    });
  }

  res.sendStatus(200);
});

// Omnibar moderation tool POSTs to here.
app.post('/omnibar_mod', (req, res) => {
  // Reject POSTs without the correct key.
  if (config.http.key && req.query.key !== config.http.key) {
    res.sendStatus(403);
    return;
  }

  // Return a 400 if the body is not supplied.
  if (!req.body) {
    res.sendStatus(400);
    return;
  }

  // Twitter Tweets
  if (req.body.provider === 'twitter' && req.body.type === 'tweet') {
    send('new-screened-tweet', {
      message: {
        full_text: req.body.message.full_text,
      },
      user: {
        name: req.body.user.name,
      },
    });
  }

  // Twitch Subs
  if (req.body.provider === 'twitch' && ['sub', 'resub', 'giftsub'].includes(req.body.type)) {
    send('new-screened-sub', {
      message: {
        trailing: req.body.message.trailing,
        tags: {
          'system-msg': req.body.message.tags['system-msg'],
        },
      },
    });
  }

  res.json({ success: true });
});

function send(queue: string, data: object) {
  mqChan.sendToQueue(
    queue,
    Buffer.from(JSON.stringify(data)),
  );
  queueLog(queue, JSON.stringify(data));
}

function queueLog(queue: string, data: string) {
  console.log('Sending to queue %s: %s', queue, data);
}
