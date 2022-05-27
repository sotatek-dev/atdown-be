"use strict";

const ForbiddenException = use('App/Exceptions/ForbiddenException');
const sigUtil = require('eth-sig-util')
const Web3 = require('web3')
const Const = use('App/Common/Const');
const web3 = new Web3();

class CheckAdminSignature {
  async handle({ request, }, next) {
    try {
      const params = request.all();
      const headers = request.headers();
      const signature = params.signature;
      const message = headers.msgsignature;

      console.log('Check Signature with: ', params);
      console.log('Message: ', message);

      let recover = await web3.eth.accounts.recover(message, signature);
      const recoverConvert = Web3.utils.toChecksumAddress(recover);
      const wallet_address = Web3.utils.toChecksumAddress(params.wallet_address);
      console.log('recoverConvert: ', recover, recoverConvert, wallet_address);

      if (recoverConvert && recoverConvert !== wallet_address) {
        throw new ForbiddenException('Invalid signature!');
      }

      headers.wallet_address = wallet_address;
      await next();
    } catch (e) {
      console.log(e);
      throw new ForbiddenException('Unauthorized!');
    }
  }
}

module.exports = CheckAdminSignature;
