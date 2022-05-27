const ErrorFactory = use('App/Common/ErrorFactory');
class ForgotPassword {
  get rules() {
    return {
      signature: 'required',
      email: 'required',
    };
  }

  get messages() {
    return {
      'signature.required': 'You must provide a signature.',
      'email.required': 'You must provide a email.',
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessage) {
    return ErrorFactory.validatorException(errorMessage)
  }
}

module.exports = ForgotPassword;
