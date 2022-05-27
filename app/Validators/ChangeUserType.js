const ErrorFactory = use('App/Common/ErrorFactory');
class ChangeUserType {
  get rules() {
    return {
      email: 'required',
      type: 'required|number',
    };
  }

  get messages() {
    return {
      'email.required': 'You must provide a email.',
      'type.required': 'You must provide a type.',
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessage) {
    return ErrorFactory.validatorException(errorMessage)
  }
}

module.exports = ChangeUserType;
