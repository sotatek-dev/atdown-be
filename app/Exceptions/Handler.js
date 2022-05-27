const BaseExceptionHandler = use('BaseExceptionHandler');
const logger = require('log4js').getLogger('ErrorHandler');

logger.level = 'info';

/**
 * This class handles all exceptions thrown during
 * the HTTP request lifecycle.
 *
 * @class ExceptionHandler
 */
class ExceptionHandler extends BaseExceptionHandler {
  /**
   * Handle exception thrown during the HTTP lifecycle
   *
   * @method handle
   *
   * @param  {Object} error
   * @param  {Object} options.request
   * @param  {Object} options.response
   *
   * @return {void}
   */
  async handle(error, ctx) {
    if (ctx.request.trx) {
      ctx.request.trx.rollback();
    }
    return super.handle(error, ctx);
  }

  /**
   * Report exception for logging or debugging.
   *
   * @method report
   *
   * @param  {Object} error
   * @param  {Object} options.request
   *
   * @return {void}
   */
  async report(error, { request }) {
    logger.error(error);
  }
}

module.exports = ExceptionHandler;
