# feathers-alive-ready

[![npm version](https://badge.fury.io/js/feathers-alive-ready.svg)](https://badge.fury.io/js/feathers-alive-ready)
[![test-lib](https://github.com/lwhiteley/feathers-alive-ready/workflows/test-lib/badge.svg)](https://github.com/lwhiteley/feathers-alive-ready)

feathersjs health check endpoints

> a plugin to add health check endpoints to a feathersjs application

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
import { health } from 'feathers-alive-ready';
import mongoose from './mongoose';

// Initialize the application
const app = feathers();

// Initialize the plugin before all other services that may require
// a health check
app.configure(health());
app.configure(mongoose);
```

What happens in step 2

By default, the plugin will add two endponts `/health/alive` and `/health/ready` to the application.

### Step 3: Tell the application when your service is ready

Use the helper method below to tell the application your service is now ready

```js
// ./mongoose.ts

import { setReady } from 'feathers-alive-ready';

export default function (app: Application) {
  mongoose
    .connect(app.get('mongodb'), {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      setReady(app, 'mongoose');
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

| Property   | default         | description                                                                                                 |
| ---------- | :-------------- | ----------------------------------------------------------------------------------------------------------- |
| configKey  | `readiness`     | which property to look for the readiness config in the app config files                                     |
| returnData | false           | determines if to return the readiness object in the ready endpoint                                          |
| aliveUrl   | `/health/alive` | alive endpoint                                                                                              |
| readyUrl   | `/health/ready` | ready endpoint                                                                                              |
| customOnly | false           | will only honour custom checks when set to true, if false will honour both readiness config + custom checks |
| custom     | []              | an array of functions that return a boolean eg. `[(app) => true]`                                           |

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

### Optional Configuration

If you want to do your own custom checks then do the following

```js
app.configure(
  health({
    customOnly: true,
    custom: [(app: Application) => !!app.get('mongooseClient')],
  }),
);
```

## License

Licensed under the [MIT license](LICENSE).
