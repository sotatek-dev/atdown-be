const { LogicalException } = require('@adonisjs/generic-exceptions');

class UnprocessableEntityException extends LogicalException {
  constructor(attribute, message, status) {
    super();
    this.attribute = attribute || null;
    this.message = message || 'Unprocessable Entity';
    this.status = status || 422;
  }

  handle(error, { response }) {
    const message = {
      message: this.message,
      msgCode: this.msgCode,
      attribute: this.attribute
    };
    return response.unprocessableEntity(message);
  }
}

module.exports = UnprocessableEntityException;
