const ErrorFactory = use('App/Common/ErrorFactory');
const Const = use('App/Common/Const');

class UpdateProfile {
  get rules() {
    return {
      lastname: 'max:255',
      firstname: 'max:255',
    };
  }

  get messages() {
    return {
      'lastname.max': Const.TEXT_MAX_LENGTH + ' characters maximum',
      'firstname.max': Const.TEXT_MAX_LENGTH + ' characters maximum',
    };
  }

  get validateAll() {
    return true;
  }

  async fails(errorMessage) {
    return ErrorFactory.validatorException(errorMessage)
  }
}

module.exports = UpdateProfile;
