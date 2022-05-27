const BadRequestException = use('App/Exceptions/BadRequestException');

class OperatorAddressExistedException extends BadRequestException {
  constructor(input, message, msgCode) {
    super();
    this.input = input;
    this.message = message || 'Blockchain address already existed.';
    this.msgCode = msgCode || 'INPUT_0004';
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
module.exports = OperatorAddressExistedException;
