"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_extra_1 = __importDefault(require("fs-extra"));
var lodash_1 = __importDefault(require("lodash"));
var path_1 = __importDefault(require("path"));
function loadConfig() {
    var defaultConfig = fs_extra_1.default.readJSONSync(path_1.default.join(process.cwd(), './default-config.json'), { throws: false });
    defaultConfig.http.keys = {};
    var extraConfig = fs_extra_1.default.readJSONSync(path_1.default.join(process.cwd(), './config.json'), { throws: false });
    var env = process.env;
    var envKeys = Object.keys(env).reduce(function (previousValue, currentValue) {
        var obj = previousValue;
        if (env[currentValue] && currentValue.startsWith('HTTP_KEY_')) {
            obj[currentValue.replace('HTTP_KEY_', '')] = env[currentValue] || '';
        }
        return obj;
    }, {});
    var envPort = (env.HTTP_PORT && !Number.isNaN(parseInt(env.HTTP_PORT, 0))) ? parseInt(env.HTTP_PORT, 0) : undefined;
    var envConfig = {
        http: {
            port: envPort,
            keys: envKeys,
        },
        rabbitmq: {
            protocol: env.RABBITMQ_PROTOCOL,
            hostname: env.RABBITMQ_HOSTNAME,
            username: env.RABBITMQ_USERNAME,
            password: env.RABBITMQ_PASSWORD,
            vhost: env.RABBITMQ_VHOST,
        },
    };
    return lodash_1.default.merge(defaultConfig, extraConfig, envConfig);
}
exports.loadConfig = loadConfig;
