const ErrorFactory = use('App/Common/ErrorFactory');
class Register {
  get rules() {
    return {
      signature: 'required',
      // password: 'required',
      email: 'required|email',
      // username: 'required',
      wallet_address: 'required',
    };
  }

  get messages() {
    return {
      'signature.required': 'You must provide a signature.',
      // 'password.required': 'You must provide a password.',
      'email.required': 'You must provide a email.',
      'email.email': 'Email format is not correct.',
      // 'username.required': 'You must provide a username.',
      'wallet_address.required': 'You must provide a wallet address.',
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessage) {
    return ErrorFactory.validatorException(errorMessage)
  }
}

module.exports = Register;
