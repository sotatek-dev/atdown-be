'use strict'

const transactionModel = use('App/Models/Transaction')
const Bignumber = use('bignumber.js')
const Config = use('Config')

class transactionService{
  async createTran(param, campaign_id, name, symbol, decimals_reship, decimals){
    const find = await transactionModel.query().where('transaction_hash', param.txHash).first();
    if(!find){
      const transaction = new transactionModel();
      transaction.purchaser = param.params.purchaser;
      transaction.campaign_id = campaign_id;
      transaction.beneficiary = param.params.beneficiary;
      transaction.value_paid = new Bignumber(param.params.value).dividedBy(Math.pow(10,decimals_reship)).toFixed();
      transaction.amount_received = new Bignumber(param.params.amount).dividedBy(Math.pow(10,decimals)).toFixed();
      transaction.token = param.params.token;
      transaction.transaction_hash = param.txHash;
      transaction.name = name;
      transaction.type = Config.get('const.' + param.event);
      transaction.symbol = symbol;
      await transaction.save();
      return transaction;
    }else{
      find.purchaser = param.params.purchaser;
      find.campaign_id = campaign_id;
      find.beneficiary = param.params.beneficiary;
      find.value_paid = new Bignumber(param.params.value).dividedBy(Math.pow(10,decimals_reship)).toFixed();
      find.amount_received = new Bignumber(param.params.amount).dividedBy(Math.pow(10,decimals)).toFixed();
      find.token = param.params.token;
      find.transaction_hash = param.txHash;
      find.name = name;
      find.type = Config.get('const.' + param.event);
      find.symbol = symbol;
      await find.save()
      return find;
    }

  }

  async checkTransactionIsset(transaction_hash){
    const find = await transactionModel.query().where('transaction_hash', transaction_hash).first();
    if(find){
      return false
    }
    return true
  }

}

module.exports = transactionService
