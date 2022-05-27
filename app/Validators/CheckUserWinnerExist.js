const ErrorFactory = use('App/Common/ErrorFactory');

class CheckUserWinnerExist {
  get rules() {
    return {
      wallet_address: 'required',
    };
  }

  get messages() {
    return {
      'wallet_address.required': 'You must provide a wallet_address.',
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessage) {
    return ErrorFactory.validatorException(errorMessage)
  }
}

module.exports = CheckUserWinnerExist;
