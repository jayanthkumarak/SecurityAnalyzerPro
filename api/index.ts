import Fastify from 'fastify';
import cors from '@fastify/cors';
import { analyzeArtifact } from './lib/services/file-processing-service';
import { renderReport } from './lib/services/claude-analysis-service';

const app = Fastify({ logger: true });
await app.register(cors, { origin: '*' });

app.post('/analyze', async (req, reply) => {
  const { path, format = 'md' } = req.body as { path: string; format?: string };
  const parsed = await analyzeArtifact(path);
  const report = await renderReport(parsed, format);
  return { report };
});

app.listen({ port: 4000 }, () =>
  console.log('🚀 API ready → http://localhost:4000'),
);