# mq-repeater

A temporary bridge between certain services and our RabbitMQ server that don't support it natively.

## Installation/Usage

```cmd
git clone https://github.com/esamarathon/mq-repeater.git
npm install
npm run build
npm run package
npm start
```

A Docker container is also available [on Docker Hub](https://cloud.docker.com/u/esamarathon/repository/docker/esamarathon/mq-repeater).

## Configuration

You can either configure the settings through a `config.json` file (see `default-config.json`) or by using environment variables.

```
HTTP_PORT=1234
HTTP_KEY=DEFAULT_KEY
RABBITMQ_PROTOCOL=amqps
RABBITMQ_HOSTNAME=URL
RABBITMQ_USERNAME=USERNAME
RABBITMQ_PASSWORD=PASSWORD
RABBITMQ_VHOST=VHOST
```
