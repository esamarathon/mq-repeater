import bodyParser from 'body-parser';
import express, { Request, Response } from 'express';
import http from 'http';
import { Config } from './config';
import { MQ } from './mq';

export class HTTPServer {
  config: Config;
  mq: MQ;
  app: express.Express;
  server: http.Server;
  constructor(config: Config, mq: MQ) {
    this.config = config;
    this.mq = mq;

    // Set up HTTP server.
    console.log('HTTP server starting...');
    this.app = express();
    this.server = new http.Server(this.app);
    this.app.use(bodyParser.json());
    this.server.listen(config.http.port);
    console.log(`HTTP server listening on port ${config.http.port}.`);
  }

  initRoutes() {
    // A GET in case you need to check the server is running.
    this.app.get('/', (req, res) => {
      res.send('Running OK');
    });

    this.app.post('/tracker', (req, res) => {
      this.handleTracker(req, res);
    });

    this.app.post('/omnibar_mod', (req, res) => {
      this.handleOmnibar(req, res);
    });
  }

  handleTracker(req: Request, res: Response) {
    // Reject POSTs without the correct key.
    if (this.config.http.key && req.query.key !== this.config.http.key) {
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
      this.mq.send(this.config.rabbitmq.exchanges.tracker, `${req.body.event}.donation.${req.body.id}.fully_processed`, {
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
      this.mq.send(this.config.rabbitmq.exchanges.tracker, `${req.body.event}.donation_total.updated`, {
        event: req.body.event,
        new_total: parseFloat(req.body.new_total),
      });
    }

    res.sendStatus(200);
  }

  handleOmnibar(req: Request, res: Response) {
    // Reject POSTs without the correct key.
    if (this.config.http.key && req.query.key !== this.config.http.key) {
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
      this.mq.send(this.config.rabbitmq.exchanges.moderation, 'screened.tweet', {
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
      this.mq.send(this.config.rabbitmq.exchanges.moderation, 'screened.sub', req.body);
    }

    // Twitch Cheers
    if (req.body.provider === 'twitch' && req.body.type === 'cheer') {
      this.mq.send(this.config.rabbitmq.exchanges.moderation, 'screened.cheer', req.body);
    }

    res.json({ success: true });
  }

}