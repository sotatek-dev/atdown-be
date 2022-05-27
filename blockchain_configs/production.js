module.exports = {
  // WEB3_API_URL: 'https://aged-polished-cloud.quiknode.pro/c3f04c3566969b1abf35082e43565e17c0691df3/',
  // WEB3_BSC_API_URL: 'https://shy-muddy-log.bsc.quiknode.pro/de9022e6dfc8f7c6b5701a71c5878cdf2c327ade/',
  // // WEB3_API_URL: 'https://rinkeby-rpc.sotatek.com',
  // WEB3_POLYGON_API_URL: 'https://icy-ancient-brook.matic.quiknode.pro/5eb31582ef99f82659c5fd8da161aa230f4307b9/',

  // WEB3_API_URL: 'https://rinkeby-rpc.sotatek.com',
  WEB3_API_URL: 'https://goerli.infura.io/v3/f1464dc327c64a93a31220b50334bf78',
  // WEB3_API_URL: 'https://goerli.infura.io/v3/3a18fd787c2342c4915364de4955bcf5',
  WEB3_BSC_API_URL: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  WEB3_POLYGON_API_URL: 'https://rpc-mumbai.matic.today/',
  AVERAGE_BLOCK_TIME: 15000,
  REQUIRED_CONFIRMATION: 3,
  CHAIN_ID: 80001,
  contracts: {
    CampaignFactory: {
      CONTRACT_DATA: require('./contracts/Normal/CapaignFactory.json'),
      CONTRACT_CLAIMABLE: require('./contracts/Claim/CapaignFactory.json'),
      CONTRACT_ADDRESS: '0x1f2275baB9FA953Ee204e15cE33F70dc0F30734e',
      FIRST_CRAWL_BLOCK: 26293193,
      BLOCK_NUM_IN_ONE_GO: 100,
      BREAK_TIME_AFTER_ONE_GO: 1000,
      NEED_NOTIFY_BY_WEBHOOK: true
    },
    Campaign: {
      CONTRACT_DATA: require('./contracts/Normal/Campaign.json'),
      CONTRACT_CLAIMABLE: require('./contracts/Claim/Campaign.json'),
      CONTRACT_ADDRESS: '0xdf7986c3C00A08967285382A3f1476Cbe7e91ba0',
      FIRST_CRAWL_BLOCK: 745,
      BLOCK_NUM_IN_ONE_GO: 100,
      BREAK_TIME_AFTER_ONE_GO: 1000,
      NEED_NOTIFY_BY_WEBHOOK: true
    },
    EthLink: {
      CONTRACT_DATA: require('./contracts/Normal/EthLink.json'),
      CONTRACT_ADDRESS: '0xdf7986c3C00A08967285382A3f1476Cbe7e91ba0',
      FIRST_CRAWL_BLOCK: 745,
      BLOCK_NUM_IN_ONE_GO: 100,
      BREAK_TIME_AFTER_ONE_GO: 1000,
      NEED_NOTIFY_BY_WEBHOOK: true
    },
    StakingPool: {
      CONTRACT_DATA: require('./contracts/StakingPool/StakingPoolProd.json'),
    }
  }
};
