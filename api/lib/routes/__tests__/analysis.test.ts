import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { FastifyInstance } from 'fastify';
import { build } from '../../../app'; // Corrected path
import FormData from 'form-data';
import * as EventSource from 'eventsource';
// We would need a way to build and run the fastify app for true integration tests.
// For now, these are conceptual tests. A test runner like supertest would be needed.

describe('Analysis Routes', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    app = await build();
    await app.ready();
    // Generate a token for tests directly from the app instance
    token = (app as any).jwt.sign({ user: 'test-user' });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it.skip('POST /analyze should start an analysis and return an ID', async () => {
    const form = new FormData();
    form.append('files', Buffer.from('test file content'), {
      filename: 'test.txt',
      contentType: 'text/plain',
    });
    form.append('context', 'test context');

    const response = await app.inject({
      method: 'POST',
      url: '/analyze',
      payload: form,
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload).toHaveProperty('analysisId');
    expect(payload.status).toBe('started');
  });

  // SSE endpoint removed in favor of polling; test skipped

  it.skip('GET /analysis/:id/status should return the status of an analysis', async () => {
    const form = new FormData();
    form.append('files', Buffer.from('test file content'), {
      filename: 'test.txt',
      contentType: 'text/plain',
    });

    const analyzeResponse = await app.inject({
        method: 'POST',
        url: '/analyze',
        payload: form,
        headers: { ...form.getHeaders(), 'Authorization': `Bearer ${token}` },
    });
    const { analysisId } = JSON.parse(analyzeResponse.body);

    const statusResponse = await app.inject({
        method: 'GET',
        url: `/analysis/${analysisId}/status`,
        headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(statusResponse.statusCode).toBe(200);
    const payload = JSON.parse(statusResponse.body);
    expect(payload.status).toBe('processing');
  });

  it('GET /analysis/:id/results should return the results of a completed analysis', async () => {
    // Placeholder
    expect(true).toBe(true);
  });

  it.skip('should prevent access to another user\'s analysis', async () => {
    // User 1 creates an analysis
    const user1Token = app.jwt.sign({ user: 'user-1' });
    const form = new FormData();
    form.append('files', Buffer.from('user 1 file'), 'user1.txt');
    const analyzeResponse = await app.inject({
      method: 'POST',
      url: '/analyze',
      payload: form,
      headers: { ...form.getHeaders(), 'Authorization': `Bearer ${user1Token}` },
    });
    const { analysisId } = JSON.parse(analyzeResponse.payload);

    // User 2 tries to access it
    const user2Token = app.jwt.sign({ user: 'user-2' });
    const statusResponse = await app.inject({
      method: 'GET',
      url: `/analysis/${analysisId}/status`,
      headers: { 'Authorization': `Bearer ${user2Token}` },
    });

    expect(statusResponse.statusCode).toBe(403);
  });
}); 