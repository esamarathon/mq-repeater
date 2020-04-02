import fsExtra from 'fs-extra';
import _ from 'lodash';
import path from 'path';

export interface Config {
  http: {
    port: number;
    keys: {
      [k: string]: string;
    };
  };
  rabbitmq: {
    protocol: string;
    hostname: string | undefined;
    username: string | undefined;
    password: string | undefined;
    vhost: string | undefined;
    exchanges: {
      tracker: string;
      moderation: string;
    };
  };
}

export function loadConfig(): Config {
  const defaultConfig: any = fsExtra.readJSONSync(
    path.join(process.cwd(), './default-config.json'),
    { throws: false },
  );
  defaultConfig.http.keys = {};
  const extraConfig: any = fsExtra.readJSONSync(
    path.join(process.cwd(), './config.json'),
    { throws: false },
  );


  const { env } = process;
  const envKeys = Object.keys(env).reduce((previousValue, currentValue) => {
    const obj = previousValue;
    if (env[currentValue] && currentValue.startsWith('HTTP_KEY_')) {
      obj[currentValue.replace('HTTP_KEY_', '')] = env[currentValue] || '';
    }
    return obj;
  }, {} as { [k: string]: string });
  const envPort = (
    env.HTTP_PORT && !Number.isNaN(parseInt(env.HTTP_PORT, 0))
  ) ? parseInt(env.HTTP_PORT, 0) : undefined;
  const envConfig: any = {
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
  return _.merge(defaultConfig, extraConfig, envConfig);
}
