const BadRequestException = use('App/Exceptions/BadRequestException');

class InputMissingException extends BadRequestException {
  constructor(input, message, msgCode) {
    super();
    this.input = input;
    this.message = message || 'Missing input';
    this.msgCode = msgCode || 'INPUT_0001';
  }

  async handle(error, { response }) {
    const message = {
      message: error.message,
      msgCode: error.msgCode,
      attribute: error.input
    };
    return response.badRequest(message);
  }
}

module.exports = InputMissingException;
