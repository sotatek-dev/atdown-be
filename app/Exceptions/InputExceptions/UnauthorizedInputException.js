const UnauthorizedException = use('App/Exceptions/UnauthorizedException');

class UnauthorizedInputException extends UnauthorizedException {
  constructor(message, msgCode) {
    super();
    this.message = message || 'Unauthorized';
    this.msgCode = msgCode || 'INPUT_0003';
  }

  async handle(error, { response }) {
    const message = {
      message: error.message,
      msgCode: error.msgCode,
      attribute: null
    };
    return response.unauthorized(message);
  }
}

module.exports = UnauthorizedInputException;
