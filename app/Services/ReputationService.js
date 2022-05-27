'use strict'
const HelperUtils = use('App/Common/HelperUtils')
const ReputationLogModel = use('App/Models/ReputationLog')
const ContractLog = use('App/Models/ContractLog')
const UserService = use('App/Services/UserService')
const StakingPoolModel = use('App/Models/StakingPool')
const BigNumber = use('bignumber.js')
const Const = use('App/Common/Const');
const CachingReputationJob = use('App/Jobs/CachingReputationJob')

const START_TIME_TRANSFER_STAKING_CONTRACT = Const.START_TIME_TRANSFER_STAKING_CONTRACT
const END_TIME_TRANSFER_STAKING_CONTRACT = Const.END_TIME_TRANSFER_STAKING_CONTRACT

class ReputationService {
  async indexStakeInfo(event, params, txHash) {
    const eventNames = ['StakedERC20', 'WithdrawnERC20', 'AllocDeposit', 'AllocWithdraw', 'LinearDeposit', 'LinearWithdraw']
    const address = HelperUtils.checkSumAddress(params.user || params.account)
    let stakingData = await ContractLog.query().where('user', address).whereIn('event', eventNames).orderBy('block_time', 'ASC').fetch()
    stakingData = JSON.parse(JSON.stringify(stakingData)).map(data => {
      return {
        ...data,
        returnValues: JSON.parse(data.return_values)
      }
    });

    await this.insertDataReputationLog({ address, stakingData, })
    CachingReputationJob.doDispatch({ walletAddress: address })
    HelperUtils.getUserTierSmart(wallet_address).then(tierInfo => {
      RedisUtils.createRedisUserTierBalance(wallet_address, tierInfo);
    })
  }
  async setReputationBonus({ walletAddress, point }) {
    const checkSumAddress = HelperUtils.checkSumAddress(walletAddress);
    const [reputationExist, userStaking] = await Promise.all([
      ReputationLogModel.query().where('wallet_address', checkSumAddress).first(),
      (new UserService).findUser({ wallet_address: checkSumAddress })
    ])

    const reputationLog = reputationExist || new ReputationLogModel

    if (!reputationExist) {
      reputationLog.wallet_address = checkSumAddress
      reputationLog.user_id = userStaking ? userStaking.id : null;
      reputationLog.staking_history = JSON.stringify({
        oldStaked: [],
        allocStaked: [],
        linearStaked: []
      })
    }
    reputationLog.bonus = point
    await reputationLog.save()
    return this.getReputationPoint(walletAddress)
  }
  async getReputationPoint(walletAddress) {
    const rkpData = await HelperUtils.calcReputationPoint.getRKPData({ walletAddress: HelperUtils.checkSumAddress(walletAddress) })
    return {
      rkpFromOldStaked: rkpData.rkpFromOldStaked,
      rkpFromNewStaked: rkpData.rkpFromNewStaked,
      rkpFromKSM: rkpData.rkpFromKSM,
      rkpBonus: rkpData.rkpBonus,
      totalRKP: rkpData.totalRKP,
    }
  }
  async getReputationHistory({ walletAddress, page, pageSize, hideZeroTx }) {
    const valueToBool = {
      "true": true,
      "false": false
    }

    const rkpData = await HelperUtils.calcReputationPoint.getRKPData({ walletAddress: HelperUtils.checkSumAddress(walletAddress) })

    let { rkpOldStakedHistories, rkpNewStakedHistories } = {
      rkpOldStakedHistories: rkpData.stakingHistory.oldStakedHistories,
      rkpNewStakedHistories: rkpData.stakingHistory.newStakedHistories
    }

    if (valueToBool[hideZeroTx]) {
      rkpOldStakedHistories = rkpOldStakedHistories.filter(his => his.points)
      rkpNewStakedHistories = rkpNewStakedHistories.filter(his => his.points)
    }

    const formatHistories = (his) => {
      return {
        ...his,
        staked: {
          ...his.staked,
          amount: this.roundingNumber(his.staked.amount)
        },
        unstaked: his.unstaked.map(unstake => {
          return {
            tx: unstake.tx,
            calculatedAmount: this.roundingNumber(unstake.calculatedAmount),
            unstakedAmount: this.roundingNumber(unstake.unstakedAmount),
            remainingAmount: this.roundingNumber(unstake.remainingAmount)
          }
        }),
        balance: this.roundingNumber(his.balance),
        points: this.roundingNumber(his.points)
      }
    }

    return {
      rkpFromOldStaked: this.roundingNumber(rkpData.rkpFromOldStaked),
      rkpFromNewStaked: this.roundingNumber(rkpData.rkpFromNewStaked),
      rkpFromKSM: this.roundingNumber(rkpData.rkpFromKSM),
      rkpBonus: this.roundingNumber(rkpData.rkpBonus),
      totalEarned: this.roundingNumber(rkpData.totalRKP),
      rkpOldStakedHistories: HelperUtils.paginationArray(rkpOldStakedHistories.map(formatHistories), page, pageSize),
      rkpNewStakedHistories: HelperUtils.paginationArray(rkpNewStakedHistories.map(formatHistories), page, pageSize)
    }
  }
  async insertDataReputationLog({ address, stakingData }) {
    const skipDupTransaction = (arr, data) => {
      if (!arr.find(item => item.transaction_hash == data.transaction_hash)) arr.push(data)
      return arr
    }

    const oldStakedEvents = stakingData.filter(data => data.event == 'StakedERC20').reduce(skipDupTransaction, [])
    const oldUnstakedEvents = stakingData.filter(data => data.event == 'WithdrawnERC20').reduce(skipDupTransaction, [])
    const allocDepositEvents = stakingData.filter(data => data.event == 'AllocDeposit').reduce(skipDupTransaction, [])
    const allocWithdrawEvents = stakingData.filter(data => data.event == 'AllocWithdraw').reduce(skipDupTransaction, [])
    const linearDepositEvents = stakingData.filter(data => data.event == 'LinearDeposit').reduce(skipDupTransaction, [])
    const linearWithdrawEvents = stakingData.filter(data => data.event == 'LinearWithdraw').reduce(skipDupTransaction, [])

    const stakingPoolContract = HelperUtils.getStakingPoolsSmartContractInstance()

    const allocPoolIds = [...new Set(allocDepositEvents.map(event => +event.returnValues.pid))]
    const linearPoolIds = [...new Set(linearDepositEvents.map(event => +event.returnValues.poolId))]

    const [allocPoolToken, linearAcceptedToken, stakingPoolIds] = (await Promise.all([
      new Promise(async (resolve, reject) => {
        try {
          const allocPoolInfo = await Promise.all(allocPoolIds.map(allocPoolId => {
            return new Promise(async (resolve, reject) => {
              try {
                const poolInfo = await stakingPoolContract.methods.allocPoolInfo(allocPoolId).call()
                return resolve({
                  [allocPoolId]: poolInfo.lpToken
                })
              } catch (error) {
                reject(error)
              }
            })
          }))

          return resolve(allocPoolInfo.reduce((obj, info) => {
            return { ...obj, ...info }
          }, {}))
        } catch (error) {
          reject(error)
        }
      }),
      stakingPoolContract.methods.linearAcceptedToken().call(),
      new Promise(async (resolve, reject) => {
        try {
          let pools = await StakingPoolModel.query()
            .where(builder => {
              builder
                .whereIn('pool_id', allocPoolIds)
                .where('staking_type', Const.STAKING_POOL_TYPE.ALLOC)
            })
            .orWhere(builder => {
              builder
                .whereIn('pool_id', linearPoolIds)
                .where('staking_type', Const.STAKING_POOL_TYPE.LINEAR)
            }).fetch()
          pools = JSON.parse(JSON.stringify(pools))
          return resolve(pools.reduce((obj, pool) => {
            return {
              ...obj,
              [pool.pool_id + '_' + pool.staking_type]: pool.id
            }
          }, {}))
        } catch (error) {
          reject(error)
        }
      })
    ]))

    allocDepositEvents.forEach(item => {
      item.returnValues.token = allocPoolToken[item.returnValues.pid]
    })
    allocWithdrawEvents.forEach(item => {
      item.returnValues.token = allocPoolToken[item.returnValues.pid]
    })
    linearDepositEvents.forEach(item => {
      item.returnValues.token = linearAcceptedToken
    })
    linearWithdrawEvents.forEach(item => {
      item.returnValues.token = linearAcceptedToken
    })

    const { oldStakedEvent, oldUnstakedEvent } = {
      oldStakedEvent: oldStakedEvents.filter(event => event.block_time < (START_TIME_TRANSFER_STAKING_CONTRACT / 1000)),
      oldUnstakedEvent: oldUnstakedEvents.filter(event => event.block_time < (START_TIME_TRANSFER_STAKING_CONTRACT / 1000))
    }

    const checkSumAddress = HelperUtils.checkSumAddress(address);
    const tokens = [...new Set([...oldStakedEvent.map(event => event.returnValues.token), ...Object.values(allocPoolToken), linearAcceptedToken])].filter(token => token)

    const tokenToDecimals = (await Promise.all(tokens.map(token => HelperUtils.getDecimalsByTokenAddress({ address: token }))))
      .reduce((obj, decimal) => {
        return { ...obj, ...decimal }
      }, {})

    const { oldStakedHistories, allocStakedHistories, linearStakedHistories } = {
      oldStakedHistories: this.getStakedHistories({ stakedEvents: oldStakedEvent, unstakedEvents: oldUnstakedEvent, tokenToDecimals }),
      allocStakedHistories: this.getStakedHistories({ stakedEvents: allocDepositEvents, unstakedEvents: allocWithdrawEvents, tokenToDecimals }).map(his => {
        return {
          ...his,
          stakingPoolId: stakingPoolIds[his.contractPoolId + '_' + Const.STAKING_POOL_TYPE.ALLOC]
        }
      }),
      linearStakedHistories: this.getStakedHistories({ stakedEvents: linearDepositEvents, unstakedEvents: linearWithdrawEvents, tokenToDecimals }).map(his => {
        return {
          ...his,
          stakingPoolId: stakingPoolIds[his.contractPoolId + '_' + Const.STAKING_POOL_TYPE.LINEAR]
        }
      })
    }
    const [reputationExist, userStaking] = await Promise.all([
      ReputationLogModel.query().where('wallet_address', checkSumAddress).first(),
      (new UserService).findUser({ wallet_address: checkSumAddress })
    ])
    const reputationLog = reputationExist || new ReputationLogModel
    reputationLog.wallet_address = checkSumAddress
    reputationLog.user_id = userStaking ? userStaking.id : null;
    reputationLog.staking_history = JSON.stringify({
      oldStaked: oldStakedHistories,
      allocStaked: allocStakedHistories,
      linearStaked: linearStakedHistories
    })

    await reputationLog.save()
  }
  formatEvents({ events, tokenToDecimals }) {
    return events.map(event => {
      const amount = new BigNumber(event.returnValues.amount || 0).dividedBy(Math.pow(10, tokenToDecimals[HelperUtils.checkSumAddress(event.returnValues.token)]))
      return {
        blockNumber: event.blockNumber,
        user: event.returnValues.user || event.returnValues.account,
        poolId: event.returnValues.poolId != null ? event.returnValues.poolId : event.returnValues.pid,
        token: event.returnValues.token,
        amount: amount,
        txHash: event.transaction_hash,
        unstakedAmount: amount,
        stakedAt: event.block_time
      }
    })
  }
  mutateUnstakedTx({ amount, token, poolId, unstakedEvents }) {
    return unstakedEvents.map(event => {
      if (event.amount.eq(0)) return
      if (amount.eq(0) || token != event.token || poolId != event.poolId) return event

      let newAmount = new BigNumber(0)
      let calculatedAmount = event.amount
      if (amount.lt(event.amount)) {
        newAmount = event.amount.minus(amount)
        calculatedAmount = amount
        amount = new BigNumber(0)
      } else {
        amount = amount.minus(event.amount)
      }

      return {
        ...event,
        calculatedAmount,
        amount: newAmount
      }
    }).filter(event => event)
  }
  getStakedHistories({ stakedEvents, unstakedEvents, tokenToDecimals }) {
    const formatStakedEvents = this.formatEvents({ events: stakedEvents, tokenToDecimals })
    let formatUnstakedEvents = this.formatEvents({ events: unstakedEvents, tokenToDecimals })
    const stakedHistories = formatStakedEvents.map(event => {
      formatUnstakedEvents = this.mutateUnstakedTx({ amount: event.amount, poolId: event.poolId, token: event.token, unstakedEvents: formatUnstakedEvents })
      const unstakeds = formatUnstakedEvents.filter(x => event.token == x.token && x.calculatedAmount)
      return {
        contractPoolId: event.poolId ? +event.poolId : undefined,
        blockNumber: event.blockNumber,
        token: event.token,
        staked: {
          txHash: event.txHash,
          amount: event.amount.toNumber()
        },
        unstaked: unstakeds.map(unstaked => {
          return {
            txHash: unstaked.txHash,
            calculatedAmount: unstaked.calculatedAmount.toNumber(),
            unstakedAmount: unstaked.unstakedAmount.toNumber()
          }
        }),
        balance: event.amount.minus(unstakeds.reduce((totalUnstaked, unstaked) => totalUnstaked.plus(unstaked.calculatedAmount), new BigNumber(0))).toNumber(),
        stakedAt: event.stakedAt
      }
    })
    return stakedHistories
  }
  roundingNumber(number) {
    return Math.round(new BigNumber(number).times(100).toNumber()) / 100
  }
}

module.exports = ReputationService