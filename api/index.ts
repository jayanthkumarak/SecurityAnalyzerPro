import { build } from './app';

const start = async () => {
    try {
        const app = await build();
        const PORT = parseInt(process.env.PORT || '4000');
        await app.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`🚀 API ready → http://localhost:${PORT}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();