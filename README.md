# serverless-offline-local-authorizers-plugin

[Serverless](http://www.serverless.com) plugin for adding authorizers when developing and testing
functions locally with [serverless-offline](https://github.com/dherault/serverless-offline).

[![Serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![npm](https://img.shields.io/npm/v/serverless-offline-local-authorizers-plugin.svg)](https://www.npmjs.com/package/serverless-offline-local-authorizers-plugin)
[![npm](https://img.shields.io/npm/l/serverless-offline-local-authorizers-plugin.svg)](https://www.npmjs.com/package/serverless-offline-local-authorizers-plugin)

This plugin allows you to add local authorizer functions to your serverless projects. These authorizers
are added dynamically in a way they can be called by `serverless-offline` but don't interfer with your
deployment and your shared authorizer functions. This helps when you have shared API Gateway authorizers
and developing and testing locally with `serverless-offline`.

> :warning: **If you are using this plugin and get schema validation errors**: Please check indentation of `localAuthorizer:` config property! See example below...

## Installation

Installing using npm:

```
npm i serverless-offline-local-authorizers-plugin --save-dev
```

## Usage

*Step 1:* Define your authorizer functions in a file called `local-authorizers.js` and put it into your
project root (that's where your `serverless.yml` lives).

If you want the local function to call your deployed shared authorizer it could look something
like this:

```javascript
const AWS = require("aws-sdk");
const mylocalAuthProxyFn = async (event, context) => {

  const lambda = new AWS.Lambda();
  const result = await lambda.invoke({
    FunctionName: "my-shared-lambda-authorizer",
    InvocationType: "RequestResponse",
    Payload: JSON.stringify(event),
  }).promise();

  if (result.StatusCode === 200) {
    return JSON.parse(result.Payload);
  }

  throw Error("Authorizer error");
};

module.exports = { mylocalAuthProxyFn };

```

Of course you could also just return a mocked response, call Cognito to mock your Cognito Authorizer or
whatever suits your needs. You can also define multiple authorizer functions if you need to.

*Step 2:* In your `serverless.yml`, add the `localAuthorizer` property to your http events. This will not interfere
with your "real" authorizers and will be ignored upon deployment. 

```yaml
functions:
  myFunction:
    handler: myFunction.handler
    events:
      - http:
          path: /my/api/path
          method: GET
          authorizer:
            type: CUSTOM
            authorizerId: abcjfk
          localAuthorizer:
            name: "mylocalAuthProxyFn"
            type: "request"

```

*Step 3:* Add the plugin to the plugins sections in `serverless.yml`:

```yaml
plugins:
  - serverless-offline-local-authorizers-plugin
  - serverless-offline
```

*Step 4:* Fire up serverless offline with the `local-authorizers` option:

```yaml
$ sls offline local-authorizers --stage dev --region eu-central-1
```

## License

MIT
