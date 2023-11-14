const express = require('express');
const { Queue } = require('bullmq');
const Redis = require('ioredis');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const redisConnection = () => {
    if (!redisConnection.instance) {
        redisConnection.instance = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: null,
        });
    }

    return redisConnection.instance;
};

redisConnection.disconnect = async () => {
    if (redisConnection.instance) {
        return redisConnection.instance.disconnect();
    }
};

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [],
  serverAdapter: serverAdapter,
});

const queueNames = new Set();
const checkForNewQueues = async () => {
    const redis = redisConnection();
    const allKeys = await redis.keys('bull:*:id');

    for (const key of allKeys) {
        const name = key.split(':')[1]; // bull:queueName:id
        if (!queueNames.has(name)) {
            queueNames.add(name);

            const queue = new Queue(name, {
                connection: redisConnection(),
            });

            addQueue(new BullMQAdapter(queue));
            console.log('Added queue ' + name);
        }
    }
};

checkForNewQueues().then(() => {});
setInterval(() => checkForNewQueues(), 15 * 1000); // every 15s

const app = express();
app.use('/admin/queues', serverAdapter.getRouter());

app.listen(3000, () => {
  console.log('Running on 3000...');
  console.log('For the UI, open http://localhost:3000/admin/queues');
});

process.on('SIGTERM', async () => {
    debug('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        debug('HTTP server closed');
    });

    await redisConnection.disconnect();
});
