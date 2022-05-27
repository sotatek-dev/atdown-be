"use strict";

class MaskEmailAndWallet {
  async handle({ request, response, view }, next) {
    await next();
    // get response data
    const data = response._lazyBody && response._lazyBody.content && response._lazyBody.content.data;
    this.doMask(data,['email', 'wallet', 'wallet_address']);
  }

  doMask(obj, fields) {
    for(const prop in obj) {
      if(!obj.hasOwnProperty(prop)) continue;
      if(fields.indexOf(prop)!=-1) {
        if (prop === 'wallet_address') {
          obj[prop] = this.maskWallet(obj[prop]);
        } else if (prop === 'email') {
          obj[prop] = this.maskEmail(obj[prop]);
        } else {
          obj[prop] = this.maskWallet(obj[prop]);
        }
      } else if(typeof obj[prop]==='object') {
        this.doMask(obj[prop], fields);
      }
    }
  }

  maskWallet(wallet) {
    if (!wallet) return wallet;
    if (typeof wallet !== 'string') return wallet;

    const preWalletLength = wallet.length;
    // get number of word to hide, 1/3 of preWallet
    const hideLength = Math.floor(preWalletLength / 3);

    // replace hide with ***
    let r = wallet.substr(hideLength, hideLength);
    wallet = wallet.replace(r, "*************");

    return wallet;
  }

  maskEmail(email) {
    if (!email) return email;
    if (typeof email !== 'string') return email;

    // console.log(`Email before mask is ${email}`);
    const preEmailLength = email.split("@")[0].length;
    // get number of word to hide, half of preEmail
    const hideLength = ~~(preEmailLength / 2);
    // console.log(hideLength);
    // create regex pattern
    const r = new RegExp(".{"+hideLength+"}@", "g")
    // replace hide with ***
    email = email.replace(r, "***@");
    // console.log(`Email after mask is ${email}`);
    return email;
  }
}

module.exports = MaskEmailAndWallet;
