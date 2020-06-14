# feathers-alive-ready

[![npm version](https://badge.fury.io/js/feathers-alive-ready.svg)](https://badge.fury.io/js/feathers-alive-ready)

feathersjs health check endpoints

> a plugin to add health check endpoints for a feathersjs application

## Installation

```
// install peer dependencies
npm install --save @feathersjs/errors @feathersjs/express @feathersjs/feathers

// install module
npm install --save feathers-alive-ready
```

## Setup

### Step 1: Add readiness config

```json
// default.json
// add any number of arbitrary keys here, mongoose is just an example
{
  "readiness": {
    "mongoose": false
  }
}
```

### Step 2: Configure the plugin

```js
import feathers from '@feathersjs/feathers';
import health from 'feathers-alive-ready';
import mongoose from './mongoose';

// Initialize the application
const app = feathers();

// Initialize the plugin before all other services that may require
// a health check
app.configure(health());
app.configure(mongoose);
```

What happens in step 2

By default the plugin will now add two endponts `/health/alive` and `/health/ready` to the application.
It will also add a function `setReady` using the `app.set` function.

### Step 3: Tell the application when your service is ready

```js
// ./mongoose.ts

export default function (app: Application) {
  mongoose
    .connect(app.get('mongodb'), {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      app.get('setReady')('mongoose');
    })
    .catch((err) => {
      logger.error(err);
      process.exit(1);
    });

  mongoose.Promise = global.Promise;

  app.set('mongooseClient', mongoose);
}
```

The `ready` endpoint will not return a positive result until all keys in the `readiness` config are truthy

## Configure

You can customize the plugin by passing in options.

| Property   | default         | description                                                             |
| ---------- | :-------------- | ----------------------------------------------------------------------- |
| configKey  | `readiness`     | which property to look for the readiness config in the app config files |
| returnData | false           | determines if to return the readiness object in the ready endpoint      |
| aliveUrl   | `/health/alive` | alive endpoint                                                          |
| readyUrl   | `/health/ready` | ready endpoint                                                          |

```js
app.configure(
  health({
    configKey: 'readiness',
    returnData: true,
    aliveUrl: '/health/alive',
    readyUrl: '/health/ready',
  }),
);
```

## License

Licensed under the [MIT license](LICENSE).
