const UnprocessableEntityException = use('App/Exceptions/UnprocessableEntityException');
const _ = require('lodash');
const HelperUtils = use('App/Common/HelperUtils');

class ValidatorException extends UnprocessableEntityException {
  constructor(field, message) {
    super();
    this.message = message || 'Invalid input';
    this.field = field;
  }

  async handle(error, { response }) {
    if (_.isArray(error.field)) {
      const errors = _.chain(error.field)
        .uniqBy('field')
        .map(({ message, field }) => ({ message, field }))
        .value();

      // Custom Response
      return response.json({
        status: 422,
        message: 'Validate Error !',
        data: {
          errors
        },
      });
      // return response.unprocessableEntity({ errors });
    }

    const errors = [
      {
        message: error.message,
        field: error.field
      }
    ];

    // Custom Response
    return response.json({
      status: 422,
      message: 'Validate Error !',
      data: errors,
    });
    // return response.unprocessableEntity({errors});
  }
}

module.exports = ValidatorException;
