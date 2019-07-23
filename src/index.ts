import { Config, loadConfig } from "./config";
import { HTTPServer } from "./http";
import { MQ } from "./mq";

const config: Config = loadConfig()
const mq = new MQ(config)
const http = new HTTPServer(config, mq);