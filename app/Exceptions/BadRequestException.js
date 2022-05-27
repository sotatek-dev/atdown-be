const { LogicalException } = require('@adonisjs/generic-exceptions');

class BadRequestException extends LogicalException {
  constructor(attribute, message, status) {
    super();
    this.attribute = attribute || null;
    this.message = message || 'Bad Request';
    this.status = status || 400;
  }

  handle(error, { response }) {
    const message = {
      message: this.message,
      msgCode: this.msgCode,
      attribute: this.attribute
    };
    return response.badRequest(message);
  }
}

module.exports = BadRequestException;
