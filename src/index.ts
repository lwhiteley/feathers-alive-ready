import { BadRequest } from '@feathersjs/errors';
import { Application as ExpressApp } from '@feathersjs/express';

type Application = ExpressApp<any>;

type ValidationFunction = { (app: Application): boolean };

export interface HealthOptions {
  configKey?: string;
  aliveUrl?: string;
  readyUrl?: string;
  returnData?: boolean;
  customOnly?: boolean;
  custom?: ValidationFunction[];
}

const READY_SETTER = 'setReady';

const defaultOptions = {
  configKey: 'readiness',
  returnData: false,
  aliveUrl: '/health/alive',
  readyUrl: '/health/ready',
  customOnly: false,
  custom: [],
};

export const health = (opts?: HealthOptions) => {
  const {
    configKey: ns,
    returnData,
    aliveUrl,
    readyUrl,
    custom,
    customOnly,
  } = {
    ...defaultOptions,
    ...(opts || {}),
  };

  return function (app: Application) {
    app.set(READY_SETTER, (key: string) => {
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
      const customResults: boolean[] = [];
      const values = Object.values(readiness);
      const isReady = customOnly ? true : values.every((value) => value);
      const isReadyWithCustom = custom.every((value: ValidationFunction) => {
        const result = value(app);
        customResults.push(result);
        return result;
      });

      const details = returnData && !customOnly ? readiness : {};
      if (customResults.length > 0 && returnData) {
        details.custom = customResults;
      }
      const ready = isReady && isReadyWithCustom;
      const data = { ...details };

      if (!Object.keys(readiness).length && !customOnly) {
        return res
          .status(400)
          .send(new BadRequest(`config.${ns} not configured`, data));
      }

      if (!ready) {
        return res
          .status(400)
          .send(new BadRequest('Application is not ready', data));
      }

      return res
        .status(returnData ? 200 : 204)
        .send(returnData ? data : undefined);
    });
  };
};

export const setReady = (app: Application, key: string) => {
  app.get(READY_SETTER)(key);
};
