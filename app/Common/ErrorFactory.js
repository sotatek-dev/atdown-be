const Const = use('App/Common/Const');

const ForbiddenException = use('App/Exceptions/ForbiddenException');
const BadRequestException = use('App/Exceptions/BadRequestException');
const NotFoundException = use('App/Exceptions/NotFoundException');
const InternalException = use('App/Exceptions/InternalException');
const UnauthorizedException = use('App/Exceptions/UnauthorizedException');
const ValidatorException = use('App/Exceptions/InputExceptions/ValidatorException');
const UnauthorizedInputException = use('App/Exceptions/InputExceptions/UnauthorizedInputException');

class ErrorFactory {
  /* Bad Request Error Family */
  static badRequest(message) {
    throw new BadRequestException(null, message);
  }

  /* Forbidden Error Family */
  static forbidden(message) {
    throw new ForbiddenException(message);
  }
  /* Not Found Error Family */
  static notFound(message) {
    throw new NotFoundException(undefined, message);
  }

  /* Internal Error Family */
  static internal(message) {
    throw new InternalException(undefined, message);
  }

  /* Unauthorized Error Family */
  static unauthorized(message) {
    throw new UnauthorizedException(message);
  }

  static validatorException(field, message) {
    throw new ValidatorException(field, message);
  }

  static unauthorizedInputException(message, msgCode) {
    throw new UnauthorizedInputException(message, msgCode);
  }
}

module.exports = ErrorFactory;
