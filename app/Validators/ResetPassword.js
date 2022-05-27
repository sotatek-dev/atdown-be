const ErrorFactory = use('App/Common/ErrorFactory');
const Const = use('App/Common/Const');

class ResetPassword {
  get rules() {
    return {
      password: 'required|min:' + Const.PASSWORD_MIN_LENGTH,
    };
  }

  get messages() {
    return {
      'password.required': 'You must provide a password.',
      'password.min': Const.PASSWORD_MIN_LENGTH + ' characters minimum',
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessage) {
    return ErrorFactory.validatorException(errorMessage)
  }
}

module.exports = ResetPassword;
