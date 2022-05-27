'use strict'

const crypto = use('crypto');
const BigNumber = use('bignumber.js');
const axios = use('axios');
const moment = use('moment');

const RedisUtils = use('App/Common/RedisUtils');
const RateSetting = use('App/Models/RateSetting');
const StakingPoolModel = use('App/Models/StakingPool');
const ReputationLogModel = use('App/Models/ReputationLog');
const TierSettingModel = use('App/Models/TierSetting');
const Const = use('App/Common/Const');
const ErrorFactory = use('App/Common/ErrorFactory');
const CachedUserModel = use('App/Models/CachedUser');

const CONFIGS_FOLDER = '../../blockchain_configs/';
const NETWORK_CONFIGS = require(`${CONFIGS_FOLDER}${process.env.NODE_ENV}`);
const CONTRACT_CONFIGS = NETWORK_CONFIGS.contracts[Const.CONTRACTS.CAMPAIGN];
const { abi: CONTRACT_ABI } = require('../../blockchain_configs/contracts/Claim/Campaign.json');
const { abi: CONTRACT_CLAIM_ABI } = CONTRACT_CONFIGS.CONTRACT_CLAIMABLE;

const STAKING_CONTRACT_CONFIGS = NETWORK_CONFIGS.contracts[Const.CONTRACTS.STAKING_POOL];
const { abi: STAKING_POOL_CONTRACT_ABI } = STAKING_CONTRACT_CONFIGS.CONTRACT_DATA;

const SBX_SMART_CONTRACT_ADDRESS = process.env.SBX_SMART_CONTRACT_ADDRESS
const UNI_LP_PKF_SMART_CONTRACT_ADDRESS = process.env.UNI_LP_PKF_SMART_CONTRACT_ADDRESS
const STAKING_POOL_SMART_CONTRACT = process.env.STAKING_POOL_SMART_CONTRACT

const TIME_REPUTATION_AGE = +(process.env.TIME_REPUTATION_AGE) || 24 * 60 * 60 // seconds
const START_TIME_TRANSFER_STAKING_CONTRACT = Const.START_TIME_TRANSFER_STAKING_CONTRACT
const END_TIME_TRANSFER_STAKING_CONTRACT = Const.END_TIME_TRANSFER_STAKING_CONTRACT

const ethereumMulticall = require('ethereum-multicall');

/**
 * Switch Link Web3
 */
const isDevelopment = process.env.NODE_ENV === 'development';
console.log('isDevelopment:===========>', isDevelopment, process.env.NODE_ENV);
const getWeb3ProviderLink = () => {
  if (isDevelopment) {
    const WEB3_API_URLS = [
      'https://goerli.infura.io/v3/c745d07314904c539668b553dbd6b670',
      'https://goerli.infura.io/v3/f1464dc327c64a93a31220b50334bf78',
      'https://goerli.infura.io/v3/2bf3314408cb41fe9e6e34f706d30d22',
      'https://goerli.infura.io/v3/1462716938c549688773a726a3f3114f',
      'https://goerli.infura.io/v3/25fd6f14fda14ae2b14c4176d0794509',
      'https://goerli.infura.io/v3/cc59d48c26f54ab58d831f545eda2bb7',
      'https://goerli.infura.io/v3/3a18fd787c2342c4915364de4955bcf5',
    ];
    const randomElement = WEB3_API_URLS[Math.floor(Math.random() * WEB3_API_URLS.length)];
    console.log('Random WEB3_API_URL: ===============> ', randomElement);
    return randomElement;
  } else {
    return NETWORK_CONFIGS.WEB3_API_URL;
  }
};
const getWeb3BscProviderLink = () => {
  if (isDevelopment) {
    const WEB3_API_URLS = [
      'https://data-seed-prebsc-1-s1.binance.org:8545',
    ];
    const randomElement = WEB3_API_URLS[Math.floor(Math.random() * WEB3_API_URLS.length)];
    return randomElement;
  } else {
    return NETWORK_CONFIGS.WEB3_BSC_API_URL;
  }
};

let web3ApiUrlIndex = 0;
const getWeb3PolygonProviderLink = (isChangeRPC = false) => {
  if (isDevelopment) {
    const WEB3_API_URLS = [
      'https://polygon-mumbai.infura.io/v3/7a89368cbd8f45d5a1a52c91db7f4fc5',
      // 'https://matic-mumbai.chainstacklabs.com',
      // 'https://rpc-mumbai.maticvigil.com',
      // 'https://matic-testnet-archive-rpc.bwarelabs.com'
    ];
    if (isChangeRPC) {
      web3ApiUrlIndex = (web3ApiUrlIndex + 1) % (WEB3_API_URLS.length);
      console.log(`=======> Change RPC URL to ${web3ApiUrlIndex} - ${WEB3_API_URLS[web3ApiUrlIndex]}`)
    }

    return WEB3_API_URLS[web3ApiUrlIndex]

    // const randomElement = WEB3_API_URLS[Math.floor(Math.random() * WEB3_API_URLS.length)];
    // return randomElement;
  } else {
    return NETWORK_CONFIGS.WEB3_POLYGON_API_URL;
  }
};

const Web3 = require('web3');
// const web3 = new Web3(NETWORK_CONFIGS.WEB3_API_URL);
// const web3Bsc = new Web3(NETWORK_CONFIGS.WEB3_BSC_API_URL);
const web3 = new Web3(getWeb3ProviderLink());
const web3Bsc = new Web3(getWeb3BscProviderLink());
const web3Polygon = new Web3(getWeb3PolygonProviderLink());

const networkToWeb3 = {
  [Const.NETWORK_AVAILABLE.ETH]: web3,
  [Const.NETWORK_AVAILABLE.BSC]: web3Bsc,
  [Const.NETWORK_AVAILABLE.POLYGON]: web3Polygon
}

const getPolygonNetwork = (props) => {
  return new Web3(getWeb3PolygonProviderLink(props.isChangeRPC));
}

// Tier Smart contract
const { abi: CONTRACT_TIER_ABI } = require('../../blockchain_configs/contracts/Normal/Tier.json');
const TIER_SMART_CONTRACT = process.env.TIER_SMART_CONTRACT;
const { abi: CONTRACT_STAKE_ABI } = require('../../blockchain_configs/contracts/Normal/MantraStake.json');
const { abi: CONTRACT_ERC20_ABI } = require('../../blockchain_configs/contracts/Normal/Erc20.json');
const MANTRA_DAO_STAKE_SMART_CONTRACT = process.env.MATRA_DAO_STAKE_SMART_CONTRACT;
const ETH_SMART_CONTRACT_USDT_ADDRESS = process.env.ETH_SMART_CONTRACT_USDT_ADDRESS;
const ETH_SMART_CONTRACT_USDC_ADDRESS = process.env.ETH_SMART_CONTRACT_USDC_ADDRESS;
const BSC_SMART_CONTRACT_USDT_ADDRESS = process.env.BSC_SMART_CONTRACT_USDT_ADDRESS;
const BSC_SMART_CONTRACT_USDC_ADDRESS = process.env.BSC_SMART_CONTRACT_USDC_ADDRESS;
const BSC_SMART_CONTRACT_BUSD_ADDRESS = process.env.BSC_SMART_CONTRACT_BUSD_ADDRESS;
const EPKF_BONUS_LINK = process.env.EPKF_BONUS_LINK || '';
const POLYGON_SMART_CONTRACT_USDT_ADDRESS = process.env.POLYGON_SMART_CONTRACT_USDT_ADDRESS;
const POLYGON_SMART_CONTRACT_USDC_ADDRESS = process.env.POLYGON_SMART_CONTRACT_USDC_ADDRESS;

const PoolStatus = Const.POOL_STATUS;

/**
 * Generate "random" alpha-numeric string.
 *
 * @param  {int}      length - Length of the string
 * @return {string}   The result
 */
const randomString = async (length = 40) => {
  let string = ''
  let len = string.length

  if (len < length) {
    let size = length - len
    let bytes = await crypto.randomBytes(size)
    let buffer = new Buffer(bytes)

    string += buffer
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substr(0, size)
  }

  return string
};

const checkIsDevelopment = () => {
  return process.env.NODE_ENV === 'development';
}

const doMask = (obj, fields) => {
  for (const prop in obj) {
    if (!obj.hasOwnProperty(prop)) continue;
    if (fields.indexOf(prop) != -1) {
      obj[prop] = this.maskEmail(obj[prop]);
    } else if (typeof obj[prop] === 'object') {
      this.doMask(obj[prop], fields);
    }
  }
};

const maskEmail = async (email) => {
  console.log(`Email before mask is ${email}`);
  const preEmailLength = email.split("@")[0].length;
  // get number of word to hide, half of preEmail
  const hideLength = ~~(preEmailLength / 2);
  console.log(hideLength);
  // create regex pattern
  const r = new RegExp(".{" + hideLength + "}@", "g")
  // replace hide with ***
  email = email.replace(r, "***@");
  console.log(`Email after mask is ${email}`);
  return email;
};

const maskWalletAddress = async (wallet) => {
  console.log(`Wallet before mask is ${wallet}`);
  const preWalletLength = wallet.length;
  console.log('preWalletLength', preWalletLength);

  // get number of word to hide, 1/3 of preWallet
  const hideLength = Math.floor(preWalletLength / 3);
  console.log('hideLength', hideLength);

  // replace hide with ***
  let r = wallet.substr(hideLength, hideLength);
  wallet = wallet.replace(r, "*************");

  console.log(`Wallet after mask is ${wallet}`);
  return wallet;
};

const checkRole = (params, extraData) => {
  return {
    ...params,
    role: params.type === Const.USER_TYPE_PREFIX.ICO_OWNER ? Const.USER_ROLE.ICO_OWNER : Const.USER_ROLE.PUBLIC_USER,
  }
};

const responseErrorInternal = (message) => {
  return {
    status: 500,
    message: message || 'Sorry there seems to be a server error!',
    data: null,
  }
};

const responseNotFound = (message) => {
  return {
    status: 404,
    message: message || 'Not Found !',
    data: null,
  }
};

const responseBadRequest = (message) => {
  return {
    status: 400,
    message: message || 'Looks like this is unkown request, please try again or contact us.',
    data: null,
  }
};

const responseSuccess = (data = null, message) => {
  return {
    status: 200,
    message: message || 'Success !',
    data,
  }
};

const checkSumAddress = (address) => {
  const addressVerified = Web3.utils.toChecksumAddress(address);
  return addressVerified;
};

const paginationArray = (array, page_number, page_size) => {
  const newData = JSON.parse(JSON.stringify(array));
  const pageData = newData.slice((page_number - 1) * page_size, page_number * page_size);
  const dataLength = newData.length;
  return {
    data: pageData,
    total: dataLength,
    perPage: page_size,
    lastPage: Math.ceil(dataLength / page_size),
    page: page_number,
  };
};

const reflect = function reflect(promise) {
  return promise
    .then((data) => {
      return { data, status: 'resolved' };
    })
    .catch((error) => {
      return { error, status: 'rejected' };
    });
}

const PromiseAll = async (values) => {
  let results;
  await (async () => {
    return await Promise.all(values.map(reflect));
  })().then(async res => {
    const errors = [];
    results = res.map(r => {
      if (r.status === 'rejected') {
        errors.push(r.error);
      }
      return r.data;
    });
    if (errors.length !== 0) {
      // have lots of error, throw first error
      throw errors[0];
    }
  });
  return results;
}


/**
 * Smart Contract Utils
 */
const getTierSmartContractInstance = () => {
  const tierSc = new web3.eth.Contract(CONTRACT_TIER_ABI, TIER_SMART_CONTRACT);
  return tierSc;
};

const getStakingPoolsSmartContractInstance = () => {
  const stakingPoolSC = new web3.eth.Contract(STAKING_POOL_CONTRACT_ABI, STAKING_POOL_SMART_CONTRACT);
  return stakingPoolSC;
};

const getMantraStakeSmartContractInstance = () => {
  const mantraSc = new web3.eth.Contract(CONTRACT_STAKE_ABI, MANTRA_DAO_STAKE_SMART_CONTRACT);
  return mantraSc;
};

const getEPkfBonusBalance = (wallet_address) => {
  return axios.get(EPKF_BONUS_LINK.replace('WALLET_ADDRESS', wallet_address))
    .catch(e => {
      return {};
    })
}

const getTiers = async () => {
  const tierSettings = (await TierSettingModel.query().orderBy('tier', 'asc').fetch()).toJSON();
  return tierSettings.map(tierSetting => Web3.utils.toWei(tierSetting.token_amount.toString()))
}

const getCampaignContract = async (network_available, token) => {
  const stakingPoolSC = new networkToWeb3[network_available].eth.Contract(CONTRACT_ABI, token);
  return stakingPoolSC;
}

const getStakingPoolSbx = async (wallet_address) => {
  const pools = await StakingPoolModel.query().where('rkp_rate', '>', 0).fetch();

  const listPool = JSON.parse(JSON.stringify(pools))
  let stakedSbx = new BigNumber('0');

  console.log('[getStakingPoolSbx] wallet address: ', wallet_address)

  // for (const pool of listPool) {
  //   if (!pool.pool_address) continue;

  //   const stakingPoolSC = new networkToWeb3[pool.network_available].eth.Contract(STAKING_POOL_CONTRACT_ABI, pool.pool_address);
  //   if (!stakingPoolSC) continue;

  //   try {
  //     switch (pool.staking_type) {
  //       case 'alloc':
  //         const [allocPoolInfo, allocUserInfo] = await Promise.all([
  //           stakingPoolSC.methods.allocPoolInfo(pool.pool_id).call(),
  //           stakingPoolSC.methods.allocUserInfo(pool.pool_id, wallet_address).call()
  //         ]);

  //         if (allocPoolInfo.lpToken.toLowerCase() === SBX_SMART_CONTRACT_ADDRESS.toLowerCase()) {
  //           stakedSbx = stakedSbx.plus(new BigNumber(allocUserInfo.amount));
  //           break;
  //         }

  //         break;
  //       case 'linear':
  //         const [linearAcceptedToken, linearStakingData] = await Promise.all([
  //           stakingPoolSC.methods.linearAcceptedToken().call(),
  //           stakingPoolSC.methods.linearStakingData(pool.pool_id, wallet_address).call()
  //         ]);

  //         if (linearAcceptedToken.toLowerCase() === SBX_SMART_CONTRACT_ADDRESS.toLowerCase()) {
  //           stakedSbx = stakedSbx.plus(new BigNumber(linearStakingData.balance));
  //         }
  //         break;
  //     }
  //   } catch (err) {
  //     console.log('getStakingPoolSbx', err)
  //   }
  // }

  // let isGetStakedInfoSuccess = false;

  // try {
  //   const multicall = new ethereumMulticall.Multicall({ web3Instance: networkToWeb3[Const.NETWORK_AVAILABLE.POLYGON], tryAggregate: true });

  //   const contractCallContext = [];

  //   contractCallContext.push({
  //     reference: 'acceptedToken',
  //     contractAddress: STAKING_POOL_SMART_CONTRACT,
  //     abi: STAKING_POOL_CONTRACT_ABI,
  //     calls: [{ reference: 'acceptedTokenCall', methodName: 'linearAcceptedToken', methodParameters: [] }]
  //   })

  //   contractCallContext.push(...listPool.map((pool) => {
  //     return {
  //       reference: 'userStakingInfoPool' + pool.pool_id,
  //       contractAddress: pool.pool_address,
  //       abi: STAKING_POOL_CONTRACT_ABI,
  //       calls: [{ reference: 'pool' + pool.pool_id, methodName: 'linearStakingData', methodParameters: [pool.pool_id, wallet_address] }]
  //     }
  //   }));

  //   const result = await multicall.call(contractCallContext);

  //   for (const [key, value] of Object.entries(result.results)) {
  //     if (key === 'acceptedToken') {
  //       if (value.callsReturnContext[0].returnValues[0].toLowerCase() !== SBX_SMART_CONTRACT_ADDRESS.toLowerCase()) {
  //         break;
  //       }
  //     } else {
  //       stakedSbx = stakedSbx.plus(new BigNumber(value.callsReturnContext[0].returnValues[0].hex));
  //     }
  //   }

  //   console.log('[getStakingPoolSbx] Get data successfully - stakedSbx: ', stakedSbx.toFixed())
  //   isGetStakedInfoSuccess = true;
  // } catch (e) {
  //   console.log('[getStakingPoolSbx] ERROR:', e);
  // }

  // if (!isGetStakedInfoSuccess) {
  //   const record = await CachedUserModel.findBy('wallet_address', wallet_address);
  //   if (record) {
  //     stakedSbx = new BigNumber(Web3.utils.toWei(record?.staked_point || 0))
  //     console.log('[getStakingPoolSbx] Get data faild - wallet address: ', wallet_address)
  //     console.log('[getStakingPoolSbx] Get data faild - stakedSbx: ', stakedSbx.toFixed())
  //   }
  // }

  const record = await CachedUserModel.findBy('wallet_address', wallet_address);
  if (!record) {
    return { stakedSbx: 0 }
  }

  stakedSbx = new BigNumber(Web3.utils.toWei(record?.staked_point || 0))

  return {
    stakedSbx: stakedSbx.toFixed(),
  };
}

const getUserTierSmart = async (wallet_address) => {
  const receivedData = await Promise.all([
    getTiers(),
    getStakingPoolSbx(wallet_address)
  ]);

  let stakedSbx = new BigNumber((receivedData[1] && receivedData[1].stakedSbx) || 0);

  // calc sbx equal
  let eSbx = new BigNumber('0');
  let rawESbx = new BigNumber('0');

  const sbxEq = new BigNumber(stakedSbx).plus(eSbx);
  console.log('[getUserTierSmart] sbxEq:', sbxEq.toFixed());

  // get 4 tiers
  let userTier = 0;
  const tiers = receivedData[0].slice(0, 9);

  console.log('Tiers=======>', tiers);
  tiers.map((sbxRequire, index) => {
    if (sbxEq.gte(sbxRequire)) {
      userTier = index + 1;
    }
  });

  console.log('[getUserTierSmart] wallet_address - userTier: ', wallet_address, userTier);
  console.log('[getUserTierSmart] sbxEq', sbxEq.toFixed());

  return [
    userTier,
    new BigNumber(sbxEq).dividedBy(Math.pow(10, 18)).toFixed(),
    new BigNumber(eSbx).dividedBy(Math.pow(10, 18)).toFixed(),
    {
      rawStakedSbx: stakedSbx.toFixed(),
      rawESbx: rawESbx.toFixed(),
      totalPoints: sbxEq.toFixed(),
    }
  ];
};

const getManyUserTierSmart = async (walletAddressArr) => {
  // GET ALL POOL
  const pools = await StakingPoolModel.query().where('rkp_rate', '>', 0).fetch();
  const listPool = JSON.parse(JSON.stringify(pools))

  // GET USERS'S STAKED SBX
  let userStakedSbxArr = [];

  const multicalGetStakingData = async (props) => {
    try {
      const multicall = new ethereumMulticall.Multicall({ web3Instance: getPolygonNetwork({ isChangeRPC: props.isChangeRPC }), tryAggregate: true });

      const contractCallContext = [];

      contractCallContext.push({
        reference: 'acceptedToken',
        contractAddress: STAKING_POOL_SMART_CONTRACT,
        abi: STAKING_POOL_CONTRACT_ABI,
        calls: [{ reference: 'acceptedTokenCall', methodName: 'linearAcceptedToken', methodParameters: [] }]
      })

      for (let i = 0; i < walletAddressArr.length; i++) {
        contractCallContext.push(...listPool.map((pool) => {
          return {
            reference: `${i}_${walletAddressArr[i]}_${pool.pool_id}`,
            contractAddress: pool.pool_address,
            abi: STAKING_POOL_CONTRACT_ABI,
            calls: [{ reference: `pool_${pool.pool_id}`, methodName: 'linearStakingData', methodParameters: [pool.pool_id, walletAddressArr[i]] }]
          }
        }));

      }

      const result = await multicall.call(contractCallContext);
      console.log('[getStakingPoolSbx] Get staking data successfully *****************')
      return result;
    } catch (error) {
      console.log('========================= *** ERROR: RPC ERROR ***. Retry.............')
      return multicalGetStakingData({ isChangeRPC: true });
    }
  }

  try {
    const result = await multicalGetStakingData({ isChangeRPC: false });

    for (let i = 0; i < walletAddressArr.length; i++) {
      userStakedSbxArr[i] = new BigNumber('0');
    }

    for (const [key, value] of Object.entries(result.results)) {
      if (key === 'acceptedToken') {
        if (value.callsReturnContext[0].returnValues[0].toLowerCase() !== SBX_SMART_CONTRACT_ADDRESS.toLowerCase()) {
          break;
        }
      } else {
        const index = key.split('_')[0];
        userStakedSbxArr[index] = userStakedSbxArr[index].plus(
          new BigNumber(value.callsReturnContext[0].returnValues[0].hex)
        );
      }
    }

    userStakedSbxArr = userStakedSbxArr.map(el => el.toFixed());

    console.log('[getStakingPoolSbx] Get data successfully - userStakedSbxArr: ')
    for (let i = 0; i < userStakedSbxArr.length; i++) {
      console.log(walletAddressArr[i])
      console.log(userStakedSbxArr[i])
    }
  } catch (e) {
    console.log('[getStakingPoolSbx] ERROR:', e);

    return {
      data: [],
      isSuccessed: false,
    }
  }

  // GET ALL TIER SETTINGS
  const tiers = (await getTiers()).slice(0, 9);
  console.log('Tiers=======>', tiers);

  const usersTierInfo = walletAddressArr.map((walletAddress, index) => {
    let stakedSbx = new BigNumber(userStakedSbxArr[index] || 0);

    // calc sbx equal
    let eSbx = new BigNumber('0');
    let rawESbx = new BigNumber('0');

    const sbxEq = new BigNumber(stakedSbx).plus(eSbx);

    let userTier = 0;
    tiers.map((sbxRequire, index) => {
      if (sbxEq.gte(sbxRequire)) {
        userTier = index + 1;
      }
    });

    console.log('[getUserTierSmart] wallet_address - userTier: ', walletAddress, userTier);
    console.log('[getUserTierSmart] sbxEq', sbxEq.toFixed());

    return [
      userTier,
      new BigNumber(sbxEq).dividedBy(Math.pow(10, 18)).toFixed(),
      new BigNumber(eSbx).dividedBy(Math.pow(10, 18)).toFixed(),
      {
        rawStakedSbx: stakedSbx.toFixed(),
        rawESbx: rawESbx.toFixed(),
        totalPoints: sbxEq.toFixed(),
      }
    ];
  })

  return {
    data: usersTierInfo,
    isSuccessed: true,
  }
};

const getExternalTokenSmartContract = async (wallet_address) => {
  const tierSc = getTierSmartContractInstance();
  const externalTokenMantra = await tierSc.methods.externalToken(MANTRA_DAO_STAKE_SMART_CONTRACT).call();
  console.log('[getExternalTokenSmartContract] - externalToken', externalTokenMantra);
  return externalTokenMantra;
};


const getUserTotalStakeSmartContract = async (wallet_address) => {
  const tierSc = getTierSmartContractInstance();
  const totalStaked = await tierSc.methods.userTotalStaked(wallet_address).call();
  console.log('[getUserTotalStakeSmartContract] - totalStaked', totalStaked);
  return totalStaked;
};

const getUnstakeMantraSmartContract = async (wallet_address) => {
  const mantraSc = getMantraStakeSmartContractInstance();
  const unstakeAmountMantra = await mantraSc.methods.getUnstake(wallet_address).call();
  console.log('[getUnstakeMantraSmartContract] - unstakeAmountMantra', unstakeAmountMantra);
  return unstakeAmountMantra;
};

const getTierBalanceInfos = async (wallet_address) => {
  const tierSc = getTierSmartContractInstance();
  const mantraSc = getMantraStakeSmartContractInstance();
  const receivedData = await Promise.all([
    // tierSc.methods.getTiers().call(),
    getTiers(),
    tierSc.methods.userTotalStaked(wallet_address).call(),
    mantraSc.methods.getUnstake(wallet_address).call(),
    tierSc.methods.externalToken(MANTRA_DAO_STAKE_SMART_CONTRACT).call(),
  ]);
  return receivedData;
};

const getABIbyCampaign = (camp) => {
  let isClaimable = true;
  if (camp && camp.pool_type && (camp.pool_type != Const.POOL_TYPE.CLAIMABLE)) {
    isClaimable = false;
  }
  let abi = isClaimable ? CONTRACT_CLAIM_ABI : CONTRACT_ABI;
  return abi;
};

const getContractInstanceDev = async (camp) => {
  const web3Dev = new Web3(getWeb3ProviderLink());
  const web3BscDev = new Web3(getWeb3BscProviderLink());
  const web3PolygonDev = new Web3(getWeb3PolygonProviderLink());
  const networkToWeb3Dev = {
    [Const.NETWORK_AVAILABLE.ETH]: web3Dev,
    [Const.NETWORK_AVAILABLE.BSC]: web3BscDev,
    [Const.NETWORK_AVAILABLE.POLYGON]: web3PolygonDev
  }
  return new networkToWeb3Dev[camp.network_available].eth.Contract(getABIbyCampaign(camp), camp.campaign_hash);
};

const getContractInstance = async (camp) => {
  if (isDevelopment) {  // Prevent limit request Infura when dev
    return getContractInstanceDev(camp);
  }
  return new networkToWeb3[camp.network_available].eth.Contract(getABIbyCampaign(camp), camp.campaign_hash);
}

const getContractClaimInstance = async (camp) => {
  return new networkToWeb3[camp.network_available].eth.Contract(CONTRACT_CLAIM_ABI, camp.campaign_hash);
}

const getTokenSoldSmartContract = async (pool) => {
  if (!pool.campaign_hash) {
    return 0;
  }
  const isClaimable = pool.pool_type == Const.POOL_TYPE.CLAIMABLE;
  const poolContract = isClaimable ? await getContractClaimInstance(pool) : await getContractInstance(pool);
  let tokenSold = await poolContract.methods.tokenSold().call();
  tokenSold = new BigNumber(tokenSold).div(new BigNumber(10).pow(18)).toFixed();
  console.log('[getTokenSoldSmartContract] - tokenSold', tokenSold);
  return tokenSold;
};

const getOfferCurrencyInfo = async (camp) => {
  // init pool contract
  const poolContract = await getContractInstance(camp);
  // get convert rate token erc20 -> our token

  let scCurrency, unit;
  switch (camp.accept_currency) {
    case Const.ACCEPT_CURRENCY.USDT:
    case Const.ACCEPT_CURRENCY.USDC:
      let networkCurrencyToContract = {
        [Const.ACCEPT_CURRENCY.USDT]: {
          [Const.NETWORK_AVAILABLE.ETH]: {
            scCurrency: ETH_SMART_CONTRACT_USDT_ADDRESS,
            uint: 6
          },
          [Const.NETWORK_AVAILABLE.BSC]: {
            scCurrency: BSC_SMART_CONTRACT_USDT_ADDRESS,
            uint: 18
          },
          [Const.NETWORK_AVAILABLE.POLYGON]: {
            scCurrency: POLYGON_SMART_CONTRACT_USDT_ADDRESS,
            uint: 6
          }
        },
        [Const.ACCEPT_CURRENCY.USDC]: {
          [Const.NETWORK_AVAILABLE.ETH]: {
            scCurrency: ETH_SMART_CONTRACT_USDC_ADDRESS,
            uint: 6
          },
          [Const.NETWORK_AVAILABLE.BSC]: {
            scCurrency: BSC_SMART_CONTRACT_USDC_ADDRESS,
            uint: 18
          },
          [Const.NETWORK_AVAILABLE.POLYGON]: {
            scCurrency: POLYGON_SMART_CONTRACT_USDC_ADDRESS,
            uint: 6
          }
        }
      }
      scCurrency = networkCurrencyToContract[camp.accept_currency][camp.network_available].scCurrency;
      unit = networkCurrencyToContract[camp.accept_currency][camp.network_available].uint;
      break;
    case Const.ACCEPT_CURRENCY.BUSD:
      scCurrency = BSC_SMART_CONTRACT_BUSD_ADDRESS;
      unit = 18;
      break;
    case Const.ACCEPT_CURRENCY.ETH:
    case Const.ACCEPT_CURRENCY.BNB:
    case Const.ACCEPT_CURRENCY.POLYGON:
      scCurrency = '0x0000000000000000000000000000000000000000';
      unit = 18;
      break;
    default:
      console.log(`Do not found currency support ${camp.accept_currency} of campaignId ${camp.id}`);
      return ErrorFactory.responseErrorInternal();
  }
  // call to SC to get rate
  const receipt = await Promise.all([
    poolContract.methods.getOfferedCurrencyRate(scCurrency).call(),
    poolContract.methods.getOfferedCurrencyDecimals(scCurrency).call()
  ]);

  const rate = receipt[0];
  const decimal = receipt[1];
  return [rate, decimal, unit];
}

const getEventSmartContract = async ({ contract, eventName, filter = {} }) => {
  const events = await contract.getPastEvents(eventName, {
    filter,
    fromBlock: 0,
    toBlock: 'latest'
  })
  return events
}

const getSymbolByTokenAddress = async ({ network = Const.NETWORK_AVAILABLE.ETH, address }) => {
  const contractToken = new networkToWeb3[network].eth.Contract(CONTRACT_ERC20_ABI, address);
  const symbol = await contractToken.methods.symbol().call();
  return {
    [checkSumAddress(address)]: symbol
  }
};

const getBlockInfo = async (blockHashOrNumber) => {
  return web3.eth.getBlock(blockHashOrNumber)
}

/**
 * Functions: Calculate Pool Progress
 */
const checkPoolIsFinish = (pool) => {
  const currentTime = moment().unix();
  return (pool.finish_time && currentTime > pool.finish_time);
};

const calculateTokenSoldWhenFinish = (totalSoldCoin) => {
  const result = new BigNumber(totalSoldCoin).minus(
    new BigNumber(totalSoldCoin).div(10000)
  ).toFixed();
  return result;
};

const getProgressWithPools = (pool) => {
  if (!pool) {
    return {
      progress: '0',
      tokenSold: '0',
      totalSoldCoin: '0',
    };
  }

  let tokenSold = pool.tokenSold || pool.token_sold || '0';
  let totalSoldCoin = pool.totalSoldCoin || pool.total_sold_coin || '0';
  let tokenSoldDisplay = pool.tokenSoldDisplay || pool.token_sold_display || '0';
  let progressDisplay = pool.progressDisplay || pool.progress_display || '0';
  let progress = '0';

  const isFinish = checkPoolIsFinish(pool);
  if (isFinish) {
    return {
      progress: '100',
      tokenSold: calculateTokenSoldWhenFinish(totalSoldCoin),
      totalSoldCoin: totalSoldCoin,
    }
  }

  if (pool.id == 22) {
    return {
      progress: '100',
      tokenSold: '500000',
      totalSoldCoin: '500000',
    };
  }

  // Merge config display with real
  const originTokenSold = tokenSold;
  tokenSold = new BigNumber(tokenSold).plus(tokenSoldDisplay).toFixed();

  // Normal Case
  if (new BigNumber(tokenSold).gt(totalSoldCoin)) { // If tokenSold > totalSoldCoin ==> tokenSold = totalSoldCoin
    tokenSold = totalSoldCoin;
  }

  // Merge config display with real
  const totalSoldCoinDiv = totalSoldCoin > 0 ? totalSoldCoin : 1;
  if (new BigNumber(progressDisplay).gt(0)) { // progressDisplay > 0
    progress = new BigNumber(originTokenSold).div(totalSoldCoinDiv).multipliedBy(100).plus(progressDisplay).toFixed();
  } else {
    progress = new BigNumber(tokenSold).div(totalSoldCoinDiv).multipliedBy(100).toFixed();
  }

  if (new BigNumber(progress).lte(0)) {
    progress = '0';
  }
  if (new BigNumber(progress).gt(99)) {
    progress = '100';
  }

  return {
    progress,
    tokenSold,
    totalSoldCoin,
  }
};

/**
 * Functions: Task Update Pool Status / Token Sold
 * Maintain Pool Status in Tasks:
 *    /app/Task/UpdateClaimablePoolInformationTask.js
 *    /app/Task/UpdatePoolInformationTask.js
 */
const getLastClaimConfig = (poolDetails) => {
  if (poolDetails.campaignClaimConfig && poolDetails.campaignClaimConfig.length > 0) {
    const lastClaim = poolDetails.campaignClaimConfig[poolDetails.campaignClaimConfig.length - 1];
    return lastClaim;
  }
  return null;
};

const getLastClaimConfigTime = (poolDetails) => {
  const lastClaim = getLastClaimConfig(poolDetails);
  if (lastClaim) {
    const startClaim = new BigNumber(lastClaim.start_time || 0).plus(7 * 24 * 3600).toFixed(); // +1week
    return startClaim;
  }
  return null;
};

const getLastActualFinishTime = (poolDetails) => {
  if (poolDetails.finish_time) {
    const actualFinishTime = new BigNumber(poolDetails.finish_time || 0).plus(10 * 60).toFixed(); // +12h
    return actualFinishTime;
  }
  return null;
};

const getFirstClaimConfig = (poolDetails) => {
  if (poolDetails && poolDetails.campaignClaimConfig && poolDetails.campaignClaimConfig.length > 0) {
    const firstClaim = poolDetails.campaignClaimConfig[0];
    return firstClaim;
  }
  return null;
};

const getPoolStatusByPoolDetail = async (poolDetails, tokenSold) => {
  if (!poolDetails) {
    return PoolStatus.TBA;
  }
  console.log('poolDetails:', JSON.stringify(poolDetails));

  const firstClaimConfig = () => {
    return getFirstClaimConfig(poolDetails);
  };
  const lastClaimConfig = () => {
    return getLastClaimConfig(poolDetails);
  };
  const lastClaimConfigTime = () => {
    return getLastClaimConfigTime(poolDetails);
  };


  const startBuyTimeField = () => {
    return poolDetails.start_time;
  };
  const endBuyTimeField = () => {
    return poolDetails.finish_time;
  };
  const startJoinTimeField = () => {
    return poolDetails.start_join_pool_time;
  };
  const endJoinTimeField = () => {
    return poolDetails.end_join_pool_time;
  };
  const releaseTimeField = () => {
    let releaseTime = poolDetails && poolDetails.release_time;
    const firstClaim = firstClaimConfig();
    if (firstClaim) {
      releaseTime = firstClaim.start_time;
    }
    return releaseTime;
  };
  const amountField = () => {
    return poolDetails.total_sold_coin;
  };

  const poolTypeField = () => {
    return poolDetails.pool_type;
  };
  const buyTypeField = () => {
    return poolDetails.buy_type;
  };

  const startBuyTime = startBuyTimeField() ? new Date(Number(startBuyTimeField()) * 1000) : undefined;
  const endBuyTime = endBuyTimeField() ? new Date(Number(endBuyTimeField()) * 1000) : undefined;
  const startJoinTime = startJoinTimeField() ? new Date(Number(startJoinTimeField()) * 1000) : undefined;
  const endJoinTime = endJoinTimeField() ? new Date(Number(endJoinTimeField()) * 1000) : undefined;
  const releaseTime = releaseTimeField() ? new Date(Number(releaseTimeField()) * 1000) : undefined;
  const isClaimable = poolTypeField() !== Const.POOL_TYPE.SWAP;
  const buyType = buyTypeField();

  // const soldProgress = new BigNumber(tokenSold).div(amountField() || 1).toFixed();
  // const soldProgress = new BigNumber(tokenSold).div(amountField() || 1).multipliedBy(100).toFixed();
  let { progress } = getProgressWithPools({
    ...poolDetails,
    tokenSold: tokenSold || poolDetails.tokenSold || poolDetails.token_sold || '0',
  });


  console.log('Process 111', progress, tokenSold, PoolStatus);

  const soldProgress = progress;
  const today = new Date().getTime();
  const requiredReleaseTime = isClaimable ? !releaseTime : false;

  console.log('Process 222', startJoinTime, endJoinTime, startBuyTime, endBuyTime)

  // Check TBA Status
  // if ((!startJoinTime || !endJoinTime) && buyType === Const.BUY_TYPE.WHITELIST_LOTTERY) {
  //   return PoolStatus.TBA;
  // }
  if ((!startJoinTime || !endJoinTime || !startBuyTime || !endBuyTime)) {
    return PoolStatus.TBA;
  }

  console.log('Process 333');

  // if ((!startBuyTime || !endBuyTime) && buyType === Const.BUY_TYPE.FCFS) {
  //   return PoolStatus.TBA;
  // }

  console.log('Process 444');

  // Check Upcoming Status
  if (startJoinTime && today < startJoinTime.getTime()) {
    return PoolStatus.UPCOMING;
  }

  console.log('Process 555');

  // exist start_join_time
  // but don't exist start_buy_time
  if (startJoinTime && !startBuyTime) {
    return PoolStatus.UPCOMING;
  }

  console.log('Process 666');

  // or current time < start buy time
  if (startBuyTime && today < startBuyTime.getTime()) {
    return PoolStatus.UPCOMING;
  }
  if (startJoinTime && endJoinTime && today > startJoinTime.getTime() && today < endJoinTime.getTime()) {
    return PoolStatus.UPCOMING;
  }
  if (endJoinTime && startBuyTime && today > endJoinTime.getTime() && today < startBuyTime.getTime()) {
    return PoolStatus.UPCOMING;
  }

  console.log('Process 777');

  // Check Claimable Status
  const lastClaimTime = lastClaimConfigTime();
  if (
    isClaimable &&
    releaseTime && lastClaimTime &&
    releaseTime.getTime() <= today && today < (lastClaimTime * 1000)
  ) {
    return PoolStatus.CLAIMABLE;
  }

  console.log('Process 888');

  const actualFinishTime = getLastActualFinishTime(poolDetails);
  const now = moment().unix();
  if (actualFinishTime && actualFinishTime < now) {
    return PoolStatus.CLOSED;
  }

  if (releaseTime && actualFinishTime && actualFinishTime > now) {
    // Check Filled Status
    // if (new BigNumber(soldProgress || 0).gte(99)) { // soldProgress >=99
    //   return PoolStatus.FILLED;
    // }
    if (
      (endBuyTime && endBuyTime.getTime() <= today && today < releaseTime.getTime()) ||
      new BigNumber(soldProgress || 0).gte(99)
    ) {
      return PoolStatus.FILLED;
    }

    // Check Progress Status
    if (
      releaseTime && today < releaseTime.getTime()
      && new BigNumber(soldProgress || 0).lt(99)
    ) {
      return PoolStatus.SWAP; // In Progress
    }
  }
  console.log('Process 9999: PoolStatus.CLOSED');

  return PoolStatus.CLOSED;
};

const getDecimalsByTokenAddress = async ({ network = Const.NETWORK_AVAILABLE.ETH, address }) => {
  const contractToken = new networkToWeb3[network].eth.Contract(CONTRACT_ERC20_ABI, address);
  const decimals = await contractToken.methods.decimals().call();
  return {
    [checkSumAddress(address)]: +decimals
  }
}

/**
 * Functions: PreOrder
 */
const checkIsInPreOrderTime = (poolDetails, currentUserTierLevel) => {
  if (!poolDetails) {
    return false;
  }
  if (currentUserTierLevel < poolDetails.pre_order_min_tier) {
    return false;
  }

  let startPreOrderTime = poolDetails.startPreOrderTime || poolDetails.start_pre_order_time;
  let startBuyTime = poolDetails.startBuyTime || poolDetails.start_time;
  if (!startPreOrderTime || !startBuyTime) {
    return false;
  }

  const now = moment().unix();
  if (startPreOrderTime < now && now < startBuyTime) {
    return true;
  }
  return false;
};

const calcReputationPoint = {
  getPoint({ amount, stakedAt, ratePKF, currentTime = Date.now() }) {
    const stakedDay = this.getStakedDay({ stakedAt, currentTime })
    const stakedAge = stakedDay > 90 ? 90 : stakedDay
    const percent = this.getPercentReputation(stakedDay) || 0
    return new BigNumber(stakedAge).times(new BigNumber(amount)).times(new BigNumber(percent)).times(new BigNumber(ratePKF)).dividedBy(100)
  },
  getStakedDay({ stakedAt, currentTime = Date.now() }) {
    return Math.floor((currentTime / 1000 - stakedAt) / TIME_REPUTATION_AGE)
  },
  getPercentReputation(stakedDay) {
    const dayToPercent = {
      60: 0.2,
      30: 0.15,
      1: 0.1,
      0: 0
    }
    return dayToPercent[Object.keys(dayToPercent).map(day => +day).sort((a, b) => b - a).find(day => stakedDay >= day)]
  },
  async getRKPData({ walletAddress, isCaching = false }) {
    if (!isCaching && await RedisUtils.checkExistRedisUserReputation(walletAddress)) {
      const cached = JSON.parse(await RedisUtils.getRedisUserReputation(walletAddress));

      const rkpCacheTimeToLive = process.env.NODE_ENV == 'development' ? 15 * 60 * 1000 : 13 * 60 * 60 * 1000 // dev: 15 minutes, prod - 13 hours

      if ((new Date()).getTime() - cached.updatedAt < rkpCacheTimeToLive) {
        return {
          rkpFromOldStaked: cached.data.rkpFromOldStaked,
          rkpFromNewStaked: cached.data.rkpFromNewStaked,
          rkpFromKSM: cached.data.rkpFromKSM,
          rkpBonus: cached.data.rkpBonus,
          totalRKP: cached.data.totalRKP,
          stakingHistory: cached.data.stakingHistory
        }
      }
      RedisUtils.delRedisUserReputation(walletAddress)
    }
    const [reputationLog, rateSetting, rkpFromKSM, contractTier] = await Promise.all([
      ReputationLogModel.query().where('wallet_address', checkSumAddress(walletAddress)).first(),
      RateSetting.query().first(),
      new Promise(async (resolve, reject) => {
        try {
          const result = await getEPkfBonusBalance(checkSumAddress(walletAddress))
          resolve(result.data && result.data.data ? +result.data.data : 0)
        } catch (error) {
          reject(error)
        }
      }),
      getTierSmartContractInstance()
    ])
    const stakedTokenToRateRKP = this.convertTokenToRateRKP(rateSetting)

    const stakingHistory = reputationLog ? JSON.parse(reputationLog.staking_history) : {
      oldStaked: [],
      allocStaked: [],
      linearStaked: []
    }

    const tokens = [...new Set(Object.values(stakingHistory).reduce((arr, poolHis) => {
      return [
        ...arr,
        ...poolHis.map(his => his.token)
      ]
    }, []))]

    const [addressTokenToSymbol, oldStakedAmount] = await Promise.all([
      new Promise(async (resolve, reject) => {
        try {
          const tokensToSymbol = await Promise.all(tokens.map(token => getSymbolByTokenAddress({ address: token })))
          return resolve(tokensToSymbol.reduce((obj, symbol) => {
            return { ...obj, ...symbol }
          }, {}))
        } catch (error) {
          reject(error)
        }
      }),
      contractTier.methods.userTotalStaked(walletAddress).call()
    ])

    const formatStakedData = ({ isOldStaked }) => {
      return (his) => {
        const ratePKF = stakedTokenToRateRKP[checkSumAddress(his.token)] || 0
        return {
          stakingPoolId: his.stakingPoolId,
          token: his.token,
          symbol: addressTokenToSymbol[checkSumAddress(his.token)],
          staked: {
            tx: his.staked.txHash,
            amount: his.staked.amount
          },
          unstaked: his.unstaked.map(unstaked => {
            return {
              tx: unstaked.txHash,
              calculatedAmount: unstaked.calculatedAmount,
              unstakedAmount: unstaked.unstakedAmount,
              remainingAmount: new BigNumber(unstaked.unstakedAmount).minus(new BigNumber(unstaked.calculatedAmount)).toNumber()
            }
          }),
          balance: his.balance,
          ratePKF,
          percent: this.getPercentReputation(this.getStakedDay({ stakedAt: his.stakedAt })),
          days: this.getStakedDay({ currentTime: isOldStaked ? Math.min(START_TIME_TRANSFER_STAKING_CONTRACT, Date.now()) : Date.now(), stakedAt: his.stakedAt }),
          points: this.getPoint({ amount: his.balance, stakedAt: his.stakedAt, ratePKF, currentTime: isOldStaked ? Math.min(START_TIME_TRANSFER_STAKING_CONTRACT, Date.now()) : Date.now() }).toNumber(),
          stakedAt: his.stakedAt
        }
      }
    }

    // inTransferTime = -1 : current time less than start of transfer time
    // inTransferTime = 0 : current time is transfer time
    // inTransferTime = 1 : current time greater than end of transfer time
    const inTransferTime = Date.now() < START_TIME_TRANSFER_STAKING_CONTRACT ? -1 : (Date.now() > END_TIME_TRANSFER_STAKING_CONTRACT ? 1 : 0)

    let { oldStakedHistories, newStakedHistories } = {
      oldStakedHistories: stakingHistory.oldStaked.map(formatStakedData({ isOldStaked: true })),
      newStakedHistories: [...stakingHistory.allocStaked, ...stakingHistory.linearStaked].sort((a, b) => { return a.stakedAt - b.stakedAt }).map(formatStakedData({ isOldStaked: false }))
    }

    if (inTransferTime == -1 || (inTransferTime == 0 && oldStakedAmount !== '0')) newStakedHistories = []

    const calcTotalPoints = (total, his) => {
      return total.plus(new BigNumber(his.points))
    }

    const totalOldStaked = oldStakedHistories.filter(his => his.balance).reduce((total, his) => {
      return total.plus(new BigNumber(his.balance).times(new BigNumber(stakedTokenToRateRKP[checkSumAddress(his.token)] || 0)))
    }, new BigNumber(0))

    const totalNewStaked = newStakedHistories.filter(his => his.balance).reduce((total, his) => {
      return total.plus(new BigNumber(his.balance).times(new BigNumber(stakedTokenToRateRKP[checkSumAddress(his.token)] || 0)))
    }, new BigNumber(0))

    if ((inTransferTime == 0 && !totalNewStaked.eq(0) && !this.checkTotalStaked({ oldStaked: totalOldStaked, newStaked: totalNewStaked })) || (inTransferTime == 1 && !this.checkTotalStaked({ oldStaked: totalOldStaked, newStaked: totalNewStaked }))) {
      oldStakedHistories = oldStakedHistories.map(his => { return { ...his, points: 0 } })
    }

    if ((new BigNumber(Date.now()).minus(new BigNumber(END_TIME_TRANSFER_STAKING_CONTRACT))).dividedBy(new BigNumber(TIME_REPUTATION_AGE).times(1000)).gte(45)) oldStakedHistories = []

    const rkpFromOldStaked = oldStakedHistories.reduce(calcTotalPoints, new BigNumber(0)).toNumber()
    const rkpFromNewStaked = newStakedHistories.reduce(calcTotalPoints, new BigNumber(0)).toNumber()

    const rkpBonus = reputationLog && reputationLog.bonus ? reputationLog.bonus : 0

    // if (inTransferTime != 1) newStakedHistories = []

    return {
      rkpFromOldStaked,
      rkpFromNewStaked,
      rkpFromKSM,
      rkpBonus,
      totalRKP: new BigNumber(rkpFromOldStaked).plus(new BigNumber(rkpFromNewStaked)).plus(new BigNumber(rkpFromKSM)).plus(new BigNumber(rkpBonus)).toNumber(),
      stakingHistory: {
        oldStakedHistories,
        newStakedHistories
      },
      tokenRate: stakedTokenToRateRKP
    }
  },
  convertTokenToRateRKP(rateSetting) {
    return {
      [checkSumAddress(UNI_LP_PKF_SMART_CONTRACT_ADDRESS)]: (rateSetting && +rateSetting.lp_pkf_rate) || 1,
      [checkSumAddress(SBX_SMART_CONTRACT_ADDRESS)]: 1
    }
  },
  checkTotalStaked({ oldStaked, newStaked }) {
    // true - keeping, fale - skip
    return newStaked.gte(oldStaked) ? true : oldStaked.minus(newStaked).lte(new BigNumber(Math.pow(10, 0)))
  }
}

const pushOnesignalNotification = async (body, playerIds) => {
  const data = {
    app_id: process.env.ONESOGNAL_APP_ID,
    contents: {
      en: body,
    },
    include_player_ids: playerIds,
  };
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
  };
  const result = await axios.post(
    Const.ONESIGNAL_NOTIFICATION_API,
    data,
    {
      headers: headers,
    }
  );
  return {
    stauts:result.status
  }
}

module.exports = {
  randomString,
  checkIsDevelopment,
  doMask,
  maskEmail,
  maskWalletAddress,
  responseSuccess,
  responseNotFound,
  responseErrorInternal,
  responseBadRequest,
  checkSumAddress,
  paginationArray,
  PromiseAll,

  getTiers,
  getTierSmartContractInstance,
  getMantraStakeSmartContractInstance,
  getCampaignContract,
  getTierBalanceInfos,
  getUserTotalStakeSmartContract,
  getUnstakeMantraSmartContract,
  getExternalTokenSmartContract,
  getUserTierSmart,
  getManyUserTierSmart,
  getContractInstance,
  getContractClaimInstance,
  getOfferCurrencyInfo,
  getTokenSoldSmartContract,
  getEventSmartContract,
  getSymbolByTokenAddress,
  getBlockInfo,
  getPoolStatusByPoolDetail,
  getProgressWithPools,
  checkPoolIsFinish,
  getWeb3ProviderLink,
  getWeb3BscProviderLink,

  getLastClaimConfig,
  getLastClaimConfigTime,
  getLastActualFinishTime,
  getFirstClaimConfig,
  getDecimalsByTokenAddress,
  getEPkfBonusBalance,
  checkIsInPreOrderTime,
  getStakingPoolsSmartContractInstance,
  pushOnesignalNotification,
  calcReputationPoint,
};
