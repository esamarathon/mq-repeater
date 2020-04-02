"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var http_1 = require("./http");
var mq_1 = require("./mq");
var config = config_1.loadConfig();
var mq = new mq_1.MQ(config);
var http = new http_1.HTTPServer(config, mq);
http.initRoutes();
