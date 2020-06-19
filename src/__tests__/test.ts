import feathers from '@feathersjs/feathers';
import express, { Application } from '@feathersjs/express';
import { Server } from 'http';

import request from 'supertest';

import { health, HealthOptions } from '../';

const port = 8998;
const defaultConfig = {
  configKey: 'readiness',
  returnData: false,
  aliveUrl: '/health/alive',
  readyUrl: '/health/ready',
};
const createApp = ({
  readiness,
  config,
}: {
  readiness?: Record<string, boolean>;
  config: HealthOptions;
}) => {
  const app: Application<any> = express(feathers());
  app.configure(health(config));

  if (config.configKey && readiness) {
    app.set(config.configKey, readiness);
  }

  return app;
};

describe('/health/alive', () => {
  let app: Application<any>;
  let server: Server;

  beforeAll(() => {
    app = createApp({ config: defaultConfig });
    server = app.listen(port);
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return 204 when setup', async () => {
    return request(app).get('/health/alive').expect(204);
  });
});

describe('/health/alive => custom endpoint', () => {
  let app: Application<any>;
  let server: Server;

  beforeAll(() => {
    app = createApp({
      config: { ...defaultConfig, aliveUrl: '/health/custom-alive' },
    });
    server = app.listen(port);
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return 204 when setup', async () => {
    return request(app).get('/health/custom-alive').expect(204);
  });
});

describe('/health/ready when readiness is not configured', () => {
  let app: Application<any>;
  let server: Server;

  beforeAll(() => {
    app = createApp({ config: defaultConfig });
    server = app.listen(port);
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return 400 when not setup', async () => {
    return request(app)
      .get('/health/ready')
      .expect(400)
      .then((response) => {
        expect(response.body.name).toEqual('BadRequest');
        expect(response.body.message).toEqual(
          'config.readiness not configured',
        );
      });
  });
});

describe('/health/ready when readiness is configured', () => {
  let app: Application<any>;
  let server: Server;

  beforeAll(() => {
    app = createApp({
      config: defaultConfig,
      readiness: { mongoose: false },
    });
    server = app.listen(port);
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return 400 when setup but service is not marked ready', async () => {
    return request(app)
      .get('/health/ready')
      .expect(400)
      .then((response) => {
        expect(response.body.name).toEqual('BadRequest');
        expect(response.body.message).toEqual('Application is not ready');
      });
  });
});

describe('/health/ready => custom endpoint', () => {
  let app: Application<any>;
  let server: Server;

  beforeAll(() => {
    app = createApp({
      config: { ...defaultConfig, readyUrl: '/health/custom-ready' },
      readiness: { mongoose: false },
    });
    server = app.listen(port);
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return 204 when ready but returnData = false', async () => {
    app.get('setReady')('mongoose');

    return request(app)
      .get('/health/custom-ready')
      .expect(204)
      .then((response) => {
        expect(response.body).toEqual({});
      });
  });
});

describe('/health/ready when readiness is configured and ready', () => {
  let app: Application<any>;
  let server: Server;

  beforeAll(() => {
    app = createApp({
      config: defaultConfig,
      readiness: { mongoose: false },
    });
    server = app.listen(port);
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return 204 when ready but returnData = false', async () => {
    app.get('setReady')('mongoose');

    return request(app)
      .get('/health/ready')
      .expect(204)
      .then((response) => {
        expect(response.body).toEqual({});
      });
  });
});

describe('/health/ready when readiness is configured and ready', () => {
  let app: Application<any>;
  let server: Server;

  beforeAll(() => {
    app = createApp({
      config: { ...defaultConfig, returnData: true },
      readiness: { mongoose: false },
    });
    server = app.listen(port);
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return 200 when ready but returnData = true', async () => {
    app.get('setReady')('mongoose');

    return request(app)
      .get('/health/ready')
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual({ mongoose: true });
      });
  });
});
