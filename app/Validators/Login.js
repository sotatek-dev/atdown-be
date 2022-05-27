const ErrorFactory = use('App/Common/ErrorFactory');
class Login {
  get rules() {
    return {
      // username: 'required',
      // email: 'required',
      signature: 'required',
      // password: 'required',
      wallet_address: 'required',
    };
  }

  get messages() {
    return {
      'wallet_address.required': 'You must provide a wallet address.',
      'signature.required': 'You must provide a signature.',
      // 'password.required': 'You must provide a password.',
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessage) {
    return ErrorFactory.validatorException(errorMessage)
  }
}

module.exports = Login;
