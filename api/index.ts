import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { analyzeArtifact } from './lib/services/file-processing-service';
import { renderReport } from './lib/services/claude-analysis-service';
import { StorageManager } from './lib/storage/storage-manager';
import { analysisRoutes } from './lib/routes/analysis';
import * as path from 'path';
import * as crypto from 'crypto';

// Initialize storage manager
const storageManager = new StorageManager({
  dbPath: path.join(process.cwd(), 'data', 'artifacts.db'),
  encryptionKey: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
  artifactsDir: path.join(process.cwd(), 'data', 'artifacts')
});

const app = Fastify({ logger: true });
await app.register(cors, { origin: '*' });
await app.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 10 // Max 10 files
  }
});

// Register analysis routes
await app.register(analysisRoutes);

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Note: The /analyze route is now handled by analysisRoutes
// See lib/routes/analysis.ts for the multi-LLM analysis implementation

// Get artifact by ID
app.get('/artifacts/:id', async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const artifact = await storageManager.getArtifact(id);
    
    if (!artifact) {
      return reply.code(404).send({ error: 'Artifact not found' });
    }

    return {
      id: artifact.id,
      filename: artifact.originalName,
      size: artifact.size,
      mimeType: artifact.mimeType,
      hash: artifact.hash,
      createdAt: artifact.createdAt
    };
  } catch (error) {
    console.error('Error retrieving artifact:', error);
    return reply.code(500).send({ error: 'Failed to retrieve artifact' });
  }
});

// Download artifact
app.get('/artifacts/:id/download', async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const artifact = await storageManager.getArtifact(id);
    
    if (!artifact) {
      return reply.code(404).send({ error: 'Artifact not found' });
    }

    const data = await storageManager.getArtifactData(id);
    if (!data) {
      return reply.code(404).send({ error: 'Artifact data not found' });
    }

    reply.header('Content-Type', artifact.mimeType);
    reply.header('Content-Disposition', `attachment; filename="${artifact.originalName}"`);
    return data;
  } catch (error) {
    console.error('Error downloading artifact:', error);
    return reply.code(500).send({ error: 'Failed to download artifact' });
  }
});

// List all artifacts
app.get('/artifacts', async (req, reply) => {
  try {
    const artifacts = await storageManager.listArtifacts();
    return artifacts.map(artifact => ({
      id: artifact.id,
      filename: artifact.originalName,
      size: artifact.size,
      mimeType: artifact.mimeType,
      hash: artifact.hash,
      createdAt: artifact.createdAt
    }));
  } catch (error) {
    console.error('Error listing artifacts:', error);
    return reply.code(500).send({ error: 'Failed to list artifacts' });
  }
});

// Delete artifact
app.delete('/artifacts/:id', async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const deleted = await storageManager.deleteArtifact(id);
    
    if (!deleted) {
      return reply.code(404).send({ error: 'Artifact not found' });
    }

    return { message: 'Artifact deleted successfully' };
  } catch (error) {
    console.error('Error deleting artifact:', error);
    return reply.code(500).send({ error: 'Failed to delete artifact' });
  }
});

const PORT = parseInt(process.env.PORT || '4000');
app.listen({ port: PORT, host: '0.0.0.0' }, () =>
  console.log(`🚀 API ready → http://localhost:${PORT}`),
);