# Serverless Workshop

## About

### What is Serverless?

- Auto-scaling
- Event driven architectures
- Where you never pay for idle boxes
- The system is implicitly fault tolerant
- Functions are the unit of deployment

Leveraging third party services to offload things that aren’t your businesses core competency. (ie user-auth, email, sms message, etc.)

**Teams focus on delivering direct value to users.**

### How did we get here?

A brief history of compute:

1. Build and maintain your own machines
2. Buy space in someone else's server farm
3. Run virtual machines in the cloud
4. Run containers in the cloud
5. Go serverless
6. World domination?

### What are the advantages of the Serverless approach?

- Pay per execution pricing model
- Lower total cost of ownership
- Default setting: Micro services
- Push vs pull. Event driven systems
- Focus more on value add vs infrastructure/maintenance

### What are the advantages of the Serverless approach?

## Setup

1. Install serverless on your machine

  ```bash
  npm install serverless -g
  ```

  Run `serverless` to see all available commands

  Run `serverless --version` to check your version number

2. Setup a FAAS (function as a service provider)

3. Use a serverless template to get started

  ```bash
  # Create service with nodeJS template in the folder ./myService
  serverless create --template aws-nodejs --path myService
  ```

## Project Structure

  `serverless.yml` is the configuration of the service. It houses all the definitions for `functions` and the `events` that trigger them.

  `handler.js` is the default file name where the function code actually lives. It could be named anything as long as your function definitions in `serverless.yml` are pointing to the correct place.

  `package.json` holds your projects dependancies. When you install dependancies from npm, they will be placed in the `node_modules` folder. You will want to `.gitignore` node modules

  `.gitignore` important for excluding dependancies from version control but more important for excluding project secrets

### Anatomy of `serverless.yml`

All properties of `serverless.yml` can be [found in the docs](https://serverless.com/framework/docs/providers/aws/guide/serverless.yml/)

```
service: myServiceNameXYZ

# (optional) - set custom options here (optional)
custom:
  customValueForUseHere: hai

# Where the code runs and what language runtime?
provider:
  name: aws
  runtime: nodejs4.3
  stage: dev
  region: us-west-2
  environment:
    MY_SECRET: xyz

# What functions and what are their triggers?
functions:
  myFunctionXYZ:
    handler: fileName.exportedFunctionName
    events:
      - http:
          method: get
          path: my-url-path

# (optional) - What resources do functions need? AWS CloudFormation
resources:
```

The above `serverless.yml` will

1. look in the `fileName.js` and grab the `module.exports.exportedFunctionName` function
2. package that code and deploy to AWS as a new cloud formation stack named `myServiceNameXYZ`
3. cloud formation then creates a Lambda function named `myFunctionXYZ` in your AWS account
4. cloud formation then create an API endpoint in API gateway `http://xxxx.region.aws.com/my-url-path` and connects that endpoint to trigger `myFunctionXYZ` when a `GET` request hits that url.

#### `serverless.yml` Events

Events are what trigger your functions to run.

Events can be:

- http endpoints (including webhooks etc)
- scheduled cron jobs
- infrastructure Events
  - [s3 events](https://serverless.com/framework/docs/providers/aws/events/s3/)
  - [database Events](https://serverless.com/framework/docs/providers/aws/events/streams/)
  - [cloudwatch events](https://serverless.com/framework/docs/providers/aws/events/cloudwatch-event/)
- Alexa Skills
- IoT Triggers

#### `serverless.yml` Resources

Resources are the other resources your functions need to work.

For example if you need a database table, you can define it in the resources section and the framework (via cloud formation) will provision the database table needed

```yml
# The "Resources" your "Functions" use.  Raw AWS CloudFormation goes in here.
resources:
  Resources:
    usersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: usersTable
        AttributeDefinitions:
          - AttributeName: email
            AttributeType: S
        KeySchema:
          - AttributeName: email
            KeyType: HASH
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1
```

#### `serverless.yml` Variables

The Serverless framework provides a powerful variable system which allows you to add dynamic data into your serverless.yml.

- Reference & load variables from environment variables or CLI options
- Recursively reference properties from the current file or other files

```
service: "myServiceNameXYZ"

provider:
  name: aws
  runtime: nodejs4.3
  environment:
    MY_SECRET: ${file(./config.prod.json):GITHUB_WEBHOOK_SECRET}
```

```
// config.prod.json
{
  "MY_SECRET": "ultra-secret-token"
}
```

We can go one step further if we have multiple stages

```
service: "myServiceNameXYZ"

custom:
  defaultStage: prod
  currentStage: ${opt:stage, self:custom.defaultStage}

provider:
  name: aws
  runtime: nodejs4.3
  environment:
    MY_SECRET: ${file(./config.${self:custom.currentStage}.json):GITHUB_WEBHOOK_SECRET}
```

Now I can have `config.prod.json` & `config.dev.json` etc. When I want to swap out the environment variables used I change the CLI flag

```
serverless deploy --stage dev
# This will grab the values from config.dev.json instead of config.prod.json
```

### Anatomy of a function

```js
// signature of a lambda
function(event, context, callback) {
  callback(error, response)
  // context.succeed in legacy code
}
```

From our previous `serverless.yml` example we had a function named `myFunctionXYZ` referencing code from the `filename.exportedFunctionName`

```js
// filename.js (typically named handler.js)
module.exports.exportedFunctionName = (event, context, callback) => {
  console.log(event) // event request data
  const stuffFromDatabase = []
  const response = {
    headers: {
       // Required for CORS support to work
      "Access-Control-Allow-Origin" : "*",
      // Required for cookies, authorization headers with HTTPS
      "Access-Control-Allow-Credentials" : true
    },
    statusCode: 200,
    body: JSON.stringify({
      apiData: stuffFromDatabase,
    })
  }

  return callback(null, response)
})
```

## Deploy function

Lets go back to the service that we have created and deploy this thing!

```
sls deploy
```

## Invoke function with CLI

Lets test the function runs

```
sls invoke -f functionName
```

## Lets change the code and redeploy

```
sls deploy function -f functionName
```

## Deploy function with node module

Cool now, lets include a package from npm and re-deploy

```
npm install faker --save
```

```
var faker = require('faker');
var randomName = faker.name.findName(); // Rowan Nikolaus
```

## Hookup function to http endpoint

[http event docs](https://serverless.com/framework/docs/providers/aws/events/apigateway/)

```
events:
  - http:
      path: posts/create
      method: post
      cors: true
```

To get the http endpoint again use the `info` command

```
serverless info
```

## S3 example

```
sls install --url https://github.com/serverless/examples/tree/master/aws-node-fetch-file-and-store-in-s3
```

```
npm install
```

```
sls deploy
```

Lets expose this function via HTTP

```
events:
  - http:
      path: save-image
      method: post
      cors: true
```

Open Postman and ping with URL

Use `sls logs -f functionName -t` to debug

Fix error!

```
const imageURL = event.image_url || JSON.parse(event.body).image_url
const key = event.key || JSON.parse(event.body).key
```

Lets add an s3 events to react to new images in the bucket

```
functions:
  notifyAdmin:
    handler: handler.notify
    events:
      - s3:
          bucket: BUCKET_NAME
          event: s3:ObjectCreated:*
```

Now lets resize the image and put it back in the bucket
https://github.com/awslabs/serverless-image-resizing/blob/master/lambda/index.js

Up next:

- [UI](https://www.netlify.com/blog/2016/11/17/serverless-file-uploads/#provisioning-the-upload-s3-bucket)?
- [Cron](https://serverless.com/framework/docs/providers/aws/events/schedule/)?
- [Protected API routes](https://github.com/serverless/examples/blob/master/aws-node-auth0-custom-authorizers-api/serverless.yml)
- [Serverless with webpack](https://github.com/elastic-coders/serverless-webpack)

## Larger Project

Let's take a look at scope.

https://github.com/serverless/scope

## Additional Resources

- [Serverless blog](http://serverless.com/blog)
- [Serverless docs](http://serverless.com/framework/docs)
- [Serverless examples](https://github.com/serverless/examples)
- [aCloudGuru tutorials](https://acloud.guru/)
- [Cloud academy tutorials](https://cloudacademy.com/library/?q=serverless)
- [Serverless stack](http://serverless-stack.com/)
