const amqp = require('amqplib');

class RabbitMQService {
    static instance;
    connection;
    channel;

    static async getInstance() {
        if (!this.instance) {
            this.instance = new RabbitMQService();
            await this.instance.init();
        }
        return this.instance;
    }

    async init() {
        this.connection = await amqp.connect(`amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`);
        this.channel = await this.connection.createChannel();
    }

    async send(queue, message) {
        await this.channel.assertQueue(queue, { durable: true });
        this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    }

    async consume(queue, callback) {
        await this.channel.assertQueue(queue, { durable: true });
        this.channel.consume(queue, (msg) => {
            if (msg !== null) {
                callback(msg);
                this.channel.ack(msg);
            }
        });
    }
}

module.exports = RabbitMQService;