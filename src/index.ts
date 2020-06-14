import { BadRequest } from '@feathersjs/errors';
import { Application } from '@feathersjs/express';

export interface HealthOptions {
  configKey?: string;
  returnData?: boolean;
  aliveUrl?: string;
  readyUrl?: string;
}

export default (opts?: HealthOptions) => {
  const { configKey: ns, returnData, aliveUrl, readyUrl } = {
    configKey: 'readiness',
    returnData: false,
    aliveUrl: '/health/alive',
    readyUrl: '/health/ready',
    ...(opts || {}),
  };

  return function (app: Application) {
    app.set('setReady', (key: string) => {
      const readiness = app.get(ns) || {};

      if (Object.keys(readiness).includes(key)) {
        app.set(ns, {
          ...readiness,
          [key]: true,
        });
      }
    });

    app.get(aliveUrl, (req, res) => {
      res.status(204).send();
    });

    app.get(readyUrl, (req, res) => {
      const readiness = req.app.get(ns) || {};
      const values = Object.values(readiness);
      const isReady = values.every((value) => value);
      const details = returnData ? readiness : {};

      if (!Object.keys(readiness).length) {
        return res
          .status(400)
          .send(new BadRequest(`config.${ns} not configured`, { ...details }));
      }

      if (!isReady) {
        return res
          .status(400)
          .send(new BadRequest('Application is not ready', { ...details }));
      }

      return res
        .status(returnData ? 200 : 204)
        .send(returnData ? readiness : undefined);
    });
  };
};
