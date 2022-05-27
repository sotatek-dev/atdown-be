"use strict";

const ErrorFactory = use('App/Common/ErrorFactory');
const BLOCK_PASS_SECRET_KEY = process.env.BLOCK_PASS_SECRET_KEY;
const {createHmac} = use('crypto');

class CheckBlockPassSignature {
  async handle({request}, next) {
    try {
      const body = request.post();
      // console.log(JSON.stringify(body))
      const signature = request.headers()['x-hub-signature'];
      const hash = createHmac('sha256', BLOCK_PASS_SECRET_KEY).update(JSON.stringify(body)).digest("hex");
      console.log(`Check header of block pass with signature ${signature} and hash ${hash}`);
      if (!signature || signature !== hash) {
        console.log('Access denied !');
        return ErrorFactory.unauthorizedInputException("Access denied: Incorrect signature !");
      }
    } catch (e) {
      console.log(e);
      return ErrorFactory.internal('Internal error !')
    }
    await next();
  }
}

module.exports = CheckBlockPassSignature;
