const amqplib = require('amqplib');
const { MESSAGE_BROKER_URL, EXCHANGE_NAME } = require('../config/serverConfig');

const createChannel = async () => {
    try {
        const connection = await amqplib.connect(MESSAGE_BROKER_URL);
        const channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: false });
        return channel;
    } catch (error) {
        throw error;
    }
}

const subscribeMessage = async (channel, service, binding_key) => {
    try {
        const applicartionQueue = await channel.assertQueue('REMINDER_QUEUE');
        channel.bindQueue(applicartionQueue.queue, EXCHANGE_NAME, binding_key);

        channel.consume(applicartionQueue.queue, msg => {
            console.log('received data');
            console.log(msg.content.toString());
            channel.ack(msg);
        });
    } catch (error) {
        throw error;
    }
}

const publishMessage = async (channel, binding_key, message) => {
    try {
        await channel.assertQueue('REMINDER_QUEUE');
        await channel.publish(EXCHANGE_NAME, binding_key, Buffer.from(message));
    }
    catch (error) {
        throw error;
    }
}

module.exports =   {
    subscribeMessage,
    createChannel,
    publishMessage
}