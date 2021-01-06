# mq-repeater

A temporary bridge between certain services and our RabbitMQ server that don't support it natively.

## Installation/Usage

```cmd
git clone https://github.com/esamarathon/mq-repeater.git
npm install
npm run build
npm start
```

A Docker image is also available under "Packages".

## Configuration

You can either configure the settings through a `config.json` file (see `default-config.json`) or by using environment variables.

```
HTTP_PORT=1234
HTTP_KEY_CUSTOMNAME=CUSTOM_KEY
RABBITMQ_PROTOCOL=amqps
RABBITMQ_HOSTNAME=URL
RABBITMQ_USERNAME=USERNAME
RABBITMQ_PASSWORD=PASSWORD
RABBITMQ_VHOST=VHOST
```
