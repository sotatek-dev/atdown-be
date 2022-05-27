const { LogicalException } = require('@adonisjs/generic-exceptions');

class ForbiddenException extends LogicalException {
  /**
   * Handle this exception by itself
   */
  handle(error, { response }) {
    return response.json({
      status: 401,
      data: null,
      message: error.message || 'Sorry, the token expired.'
    })

    // response.forbidden({ error: error.message });
  }
}

module.exports = ForbiddenException;
