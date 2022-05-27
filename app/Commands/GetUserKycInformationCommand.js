'use strict'

const { Command } = require('@adonisjs/ace')
const GetUserKycInformationJob = use('App/Jobs/GetUserKycInformationJob')
const { exit } = require('process')

class GetUserKycInformationCommand extends Command {
  static get signature() {
    return 'get-user-kyc-information'
  }

  static get description() {
    return 'Get users kyc information from BlockPass';
  }

  async handle(args, options) {
    this.info('Fetching kyc information from BlockPass')

    try {
      await GetUserKycInformationJob.doUpdateUserKycInformation()
    } catch (e) {
      this.error('Fetching kyc information fail. Finishing...');
      this.error('ERROR: ', e);
      process.exit(1);
    }

    this.info('Fetching kyc information successful !. Finished !!!');
    process.exit(0);
  }
}

module.exports = GetUserKycInformationCommand;
