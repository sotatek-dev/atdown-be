const { LogicalException } = require('@adonisjs/generic-exceptions');

class InternalException extends LogicalException {
  constructor(attribute, message, status) {
    super();
    this.attribute = attribute || null;
    this.message = message || 'Internal Server Error';
    this.status = status || 500;
  }

  handle(error, { response }) {
    const message = {
      message: this.message,
      msgCode: this.msgCode,
      attribute: this.attribute
    };
    return response.internalServerError(message);
  }
}

module.exports = InternalException;
