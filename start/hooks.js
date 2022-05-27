const { hooks } = require('@adonisjs/ignitor');
const log4js = require('log4js');
const logger = log4js.getLogger('');

function response(statusCode) {
  return function result(data) {
    this.status(statusCode).send(data);
  };
}

function extendResponse() {
  const Response = use('Adonis/Src/Response');
  Response.macro('ok', response(200));
  Response.macro('badRequest', response(400));
  Response.macro('unauthorized', response(401));
  Response.macro('forbidden', response(403));
  Response.macro('notFound', response(404));
  Response.macro('internal', response(500));
}

function setupLogger() {
  const log4js = require('log4js');
  const logger = log4js.getLogger('');
  logger.level = process.env.LOG_LEVEL || 'info';

  const Database = use('Database');
  Database.on('query', query => {
    if (process.env.NODE_ENV === 'testing') {
      return;
    }

    logger.info(`sql: ${query.sql}; bindings: [${query.bindings}]`);
  });
}

hooks.after.providersBooted(async () => {
  extendResponse();
  setupLogger();
  const Exception = use('Exception')

  Exception.handle('ExpiredJwtToken', async (error, {response, session}) => {
    logger.warn(`ExpiredJwtToken ${error}`);
    return response.json({
      status: error.status,
      message: 'Token Expired',
      msgCode: 'JWT_102'
    });
    // response.status(error.status).send({
    //   status: error.status,
    //   // message: 'The jwt token has been expired. Generate a new one to continue',
    //   message: 'Token Expired',
    //   msgCode: 'JWT_102'
    // })
  })

  Exception.handle('InvalidJwtToken', async (error, {response, session}) => {
    logger.warn(`InvalidJwtToken ${error}`);
    return response.json({
      status: error.status,
      message: 'Token Expired',
      msgCode: 'JWT_101'
    });
    // response.status(error.status).send({
    //   status: error.status,
    //   // message: 'The Jwt token is invalid',
    //   message: 'Token Expired',
    //   msgCode: 'JWT_101'
    // })
  })

  Exception.handle('InvalidRefreshToken', async (error, {response, session}) => {
    logger.warn(`InvalidRefreshToken ${error}`);
    response.status(error.status).send({
      status: error.status,
      message: 'Invalid refresh token',
      msgCode: 'JWT_103'
    })
  })

  Exception.handle('InvalidSessionException', async (error, {response, session}) => {
    logger.warn(`InvalidSessionException ${error}`);
    response.status(error.status).send({
      status: error.status,
      message: 'Invalid session',
      msgCode: 'Session_101'
    })
  })

  Exception.handle('UserNotFoundException', async (error, {response, session}) => {
    logger.warn(`UserNotFoundException ${error}`);
    response.status(error.status).send({
      status: error.status,
      message: 'Cannot find user with provided uid',
      msgCode: 'Session_102'
    })
  })

  Exception.handle('PasswordMisMatchException', async (error, {response, session}) => {
    logger.warn(`PasswordMisMatchException ${error}`);
    response.status(error.status).send({
      status: error.status,
      message: 'Invalid user password',
      msgCode: 'Pass_102'
    })
  })

  Exception.handle('InvalidBasicAuthException', async (error, {response, session}) => {
    logger.warn(`InvalidBasicAuthException ${error}`);
    response.status(error.status).send({
      status: error.status,
      message: 'Basic auth header is missing',
      msgCode: 'BasicAuth_101'
    })
  })

  Exception.handle('InvalidApiToken', async (error, {response, session}) => {
    logger.warn(`InvalidApiToken ${error}`);
    response.status(error.status).send({
      status: error.status,
      message: 'The api token is missing or invalid',
      msgCode: 'ApiToken_101'
    })
  })

  Exception.handle('Error', async (error, {response, session}) => {
    logger.warn(`Error ${error}`);
    response.status(error.status).send({
      message: error.message,
      name: error.name,
      code: error.code,
      status: error.status
    })
  })
});
