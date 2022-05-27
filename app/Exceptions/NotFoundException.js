const { LogicalException } = require('@adonisjs/generic-exceptions');

class NotFoundException extends LogicalException {
  constructor(attribute, message, status) {
    super();
    this.attribute = attribute || null;
    this.message = message || 'Not Found';
    this.status = status || 404;
  }

  handle(error, { response }) {
    const message = {
      message: this.message,
      msgCode: this.msgCode,
      attribute: this.attribute
    };
    return response.notFound(message);
  }
}

module.exports = NotFoundException;
