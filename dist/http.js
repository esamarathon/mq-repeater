"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var body_parser_1 = __importDefault(require("body-parser"));
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var HTTPServer = /** @class */ (function () {
    function HTTPServer(config, mq) {
        this.config = config;
        this.mq = mq;
        // Set up HTTP server.
        console.log('HTTP server starting...');
        this.app = express_1.default();
        this.server = new http_1.default.Server(this.app);
        this.app.use(body_parser_1.default.json());
        this.server.listen(config.http.port);
        console.log("HTTP server listening on port " + config.http.port + ".");
    }
    HTTPServer.prototype.initRoutes = function () {
        var _this = this;
        // A GET in case you need to check the server is running.
        this.app.get('/', function (req, res) {
            res.send('Running OK');
        });
        this.app.post('/tracker', function (req, res) {
            _this.handleTracker(req, res);
        });
        this.app.post('/omnibar_mod', function (req, res) {
            _this.handleOmnibar(req, res);
        });
    };
    HTTPServer.prototype.checkKey = function (httpKey) {
        var keys = this.config.http.keys;
        var validKey = Object.keys(keys).find(function (key) { return keys[key] === httpKey; });
        if (validKey) {
            console.log('HTTP key used: %s', validKey);
        }
        return validKey;
    };
    HTTPServer.prototype.handleTracker = function (req, res) {
        // Reject POSTs without the correct key.
        var validKey = this.checkKey(req.query.key);
        if (!validKey) {
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
            /* eslint-disable @typescript-eslint/camelcase */
            this.mq.send(this.config.rabbitmq.exchanges.tracker, req.body.event + ".donation." + req.body.id + ".fully_processed", {
                event: req.body.event,
                _id: req.body.id,
                donor_visiblename: req.body.donor_visiblename,
                amount: parseFloat(req.body.amount),
                comment_state: req.body.comment_state,
                comment: req.body.comment,
                time_received: req.body.time_received,
            });
            /* eslint-enable */
        }
        // Donation total change, when the total goes up when a payment is confirmed.
        /* eslint-disable @typescript-eslint/camelcase */
        if (req.body.message_type === 'donation_total_change') {
            this.mq.send(this.config.rabbitmq.exchanges.tracker, req.body.event + ".donation_total.updated", {
                event: req.body.event,
                new_total: parseFloat(req.body.new_total),
            });
            /* eslint-enable */
        }
        res.sendStatus(200);
    };
    HTTPServer.prototype.handleOmnibar = function (req, res) {
        // Reject POSTs without a correct key.
        var validKey = this.checkKey(req.query.key);
        if (!validKey) {
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
        var subTypes = [
            'sub',
            'resub',
            'subgift',
            'anonsubgift',
            'submysterygift',
            'giftpaidupgrade',
            'rewardgift',
            'anongiftpaidupgrade',
        ];
        if (req.body.provider === 'twitch' && subTypes.includes(req.body.type)) {
            this.mq.send(this.config.rabbitmq.exchanges.moderation, 'screened.sub', req.body);
        }
        // Twitch Cheers
        if (req.body.provider === 'twitch' && req.body.type === 'cheer') {
            this.mq.send(this.config.rabbitmq.exchanges.moderation, 'screened.cheer', req.body);
        }
        // Twitch Crowd Control
        if (req.body.provider === 'crowdcontrol') {
            this.mq.send(this.config.rabbitmq.exchanges.moderation, 'screened.crowdcontrol', req.body);
        }
        res.json({ success: true });
    };
    return HTTPServer;
}());
exports.HTTPServer = HTTPServer;
