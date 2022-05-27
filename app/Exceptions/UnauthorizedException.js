const { LogicalException } = require('@adonisjs/generic-exceptions');

class UnauthorizedException extends LogicalException {
  /**
   * Handle this exception by itself
   */
  constructor(attribute, message, status) {
    super();
    this.attribute = attribute || null;
    this.message = "Sorry, the token expired.";
    this.status = status || 401;
  }
}

module.exports = UnauthorizedException;
