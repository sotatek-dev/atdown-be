const BaseService = use('App/Services/BaseService');

class Utils extends BaseService {
  utf8ToHex(input) {
    return `0x${Buffer.from(input.toString(), 'utf8').toString('hex')}`;
  }

  hexToUtf8(input) {
    if (!input || !input.startsWith('0x')) {
      return null;
    }
    return `${Buffer.from(input.substr(2), 'hex').toString('utf8')}`;
  }
}

module.exports = Utils;
