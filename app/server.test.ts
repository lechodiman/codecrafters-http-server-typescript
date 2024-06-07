import { describe, expect, it } from 'bun:test';
import request from 'supertest';
import { app } from './app';

describe("'/' endpoint", () => {
  it('returns a 200 status code for the root path', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });
});

describe("'*' wildcard endpoint", () => {
  it('returns a 404 status code for undefined routes', async () => {
    const response = await request(app).get('/undefined-route');
    expect(response.status).toBe(404);
  });
});

describe('/user-agent endpoint', () => {
  it('returns the User-Agent header sent in the request', async () => {
    const userAgentString = 'MyCustomUserAgent/1.0';
    const response = await request(app)
      .get('/user-agent')
      .set('User-Agent', userAgentString);

    expect(response.status).toBe(200);
    expect(response.text).toBe(userAgentString);
    expect(response.headers['content-type']).toBe('text/plain');
  });
});

describe('/echo endpoint', () => {
  it('echoes back without encoding', async () => {
    const response = await request(app).get('/echo/test-string');
    expect(response.status).toBe(200);
    expect(response.text).toContain('test-string');
    expect(response.headers['content-type']).toBe('text/plain');
  });

  it('should set correct Content-Encoding header for gzip response', async () => {
    const res = await request(app).get('/echo/test').set('Accept-Encoding', 'gzip');

    expect(res.header['content-encoding']).toBe('gzip');
  });

  it('echoes back with unsupported encoding', async () => {
    const response = await request(app)
      .get('/echo/test-string')
      .set('Accept-Encoding', 'deflate');
    expect(response.status).toBe(200);
    expect(response.text).toContain('test-string');
    expect(response.headers['content-type']).toBe('text/plain');
  });
});
