const ErrorFactory = use('App/Common/ErrorFactory');

class CheckUserBought {
  get rules() {
    return {
      address: 'required',
      campaign: 'required',
    };
  }

  get messages() {
    return {
      'address.required': 'You must provide a address.',
      'campaign.required': 'You must provide a campaign.',
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessage) {
    return ErrorFactory.validatorException(errorMessage)
  }
}

module.exports = CheckUserBought;
