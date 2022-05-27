'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

const Const = use('App/Common/Const');

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')
Route.get('/', () => 'It\'s working')
Route.get('image/:fileName', 'FileController.getImage');

// Webhook
Route.group(() => {
  Route.post('ico-campaign', 'CampaignController.icoCampaignCreate')
  Route.post('edit-campaign', 'CampaignController.icoCampaignEdit')
  Route.post('campaign-status', 'CampaignController.CampaignEditStatus')
  Route.post('campaign-changed', 'CampaignController.CampaignChanged')
  Route.post('transaction', 'TransactionController.transactionCreate')
  Route.post('transaction-refund', 'TransactionController.transactionRefund')
  Route.post('affiliate-campaign', 'AffiliateCampaignController.affiliateCreate')
  Route.post('token-claimed', 'TransactionController.tokenClaimed')

  Route.post('mantra-stake/index-stake-info', 'MantraStakeController.indexStakeInfo');
  Route.post('reputation/index-stake-info', 'ReputationController.indexStakeInfo');
}).prefix('webhook').middleware('checkJwtWebhook');

Route.post('block-pass/receive', 'UserController.kycUpdateStatus').middleware('checkBlockPassSignature');

// ICO Owner User (Admin Page)
Route.group(() => {
  Route.get('/contract/campaign-factories', 'ContractController.campaignFactories')
  Route.get('/contract/campaigns', 'ContractController.campaigns')
  // Route.post('campaign-create', 'CampaignController.campaignCreate')
  Route.get('campaigns', 'CampaignController.campaignList')
  Route.get('campaign-new', 'CampaignController.campaignNew')
  Route.get('campaigns/:campaign', 'CampaignController.campaignShow')
  Route.get('campaign-delete/:walletAddress/:campaign', 'CampaignController.campaignDelete')
  Route.get('transactions', 'TransactionController.transactionList')

  Route.post('asset-tokens', 'AssetTokenController.create')
  Route.get('asset-tokens/:contract', 'AssetTokenController.list')
  Route.delete('asset-tokens/delete/:id', 'AssetTokenController.remove')
  Route.get('affiliate-campaign/:token', 'AffiliateCampaignController.affiliateList')

  Route.get('my-campaign', 'CampaignController.myCampaign')
  Route.get('my-campaign/:status', 'CampaignController.myCampaign').middleware('checkStatus');

  Route.put('/reputation/bonus/:walletAddress', 'ReputationController.setReputationBonus')

  Route.get('/whitelist', 'CaptchaWhitelistController.get')
  Route.post('/whitelist', 'CaptchaWhitelistController.set')
  Route.delete('/whitelist', 'CaptchaWhitelistController.remove')
}).middleware(['typeAdmin', 'auth:admin', 'checkAdminJwtSecret']);

Route.group(() => {
  Route.post('upload-avatar', 'FileController.uploadAvatar');

  // KYC
  Route.put('active-kyc', 'UserController.activeKyc');

  // Pool
  Route.post('pool/create', 'PoolController.createPool');
  Route.post('pool/:campaignId/update', 'PoolController.updatePool');
  Route.get('pool/:campaignId', 'PoolController.getPoolAdmin');
  Route.post('pool/:campaignId/deploy-success', 'PoolController.updateDeploySuccess');
  Route.post('pool/:campaignId/change-display', 'PoolController.changeDisplay');
  Route.post('pool/:campaignId/change-public-winner-status', 'PoolController.changePublicWinnerStatus');
  Route.get('test', 'WhiteListUserController.getWhiteList');
  // Tier setting
  Route.put('tier-setting/:tier', 'TierSettingController.updateTierSetting');

  // Participants
  Route.get('pool/:campaignId/participants', 'WhiteListSubmissionController.getRemainParticipants');
  Route.post('pool/:campaignId/whitelist-submission/batch/verify', 'WhiteListSubmissionController.verifyBatchWhitelistSubmission');
  Route.post('pool/:campaignId/whitelist-submission/batch/approve', 'WhiteListSubmissionController.approveBatchWhitelistSubmission');
  Route.post('pool/:campaignId/whitelist-submission/:walletAddress/verify', 'WhiteListSubmissionController.verifyWhitelistSubmission');
  Route.put('pool/:campaignId/whitelist-submission/:walletAddress', 'WhiteListSubmissionController.updateWhitelistSubmission');
  Route.delete('pool/:campaignId/participants/:walletAddress/delete', 'WhiteListUserController.deleteWhiteList');
  Route.post('pool/winner-random/:campaignId/:tier', 'WhiteListUserController.getRandomWinners');
  // Route.post('pool/winner-random-fake/:campaignId/:tier', 'WhiteListUserController.getRandomWinnersFake');

  // Winners
  Route.get('pool/:campaignId/winners', 'WinnerListUserController.getWinnerListAdmin');
  Route.delete('pool/:campaignId/winners/:walletAddress/delete', 'WinnerListUserController.deleteWinner');
  Route.post('pool/:campaignId/winners/add-to-winner', 'WinnerListUserController.addParticipantsToWinner');

  // Reserve
  Route.get('pool/:campaignId/reserves', 'ReservedListController.getReservedList');
  Route.post('pool/:campaignId/reserves/add', 'ReservedListController.addReserveUser');
  Route.delete('pool/:campaignId/reserves/:walletAddress/delete', 'ReservedListController.deleteReserve');
  Route.post('pool/reserves/update-setting', 'ReservedListController.updateReserveSetting');
  Route.get('pool/reserves/setting', 'ReservedListController.reserveSetting');

  // Staking pool
  Route.post('staking-pool/create', 'StakingPoolController.createPool');
  Route.post('staking-pool/:stakingPoolId/update', 'StakingPoolController.updatePool');
  Route.get('staking-pool', 'StakingPoolController.getPoolList');
  Route.get('staking-pool/:stakingPoolId', 'StakingPoolController.getPool');
  Route.post('staking-pool/:stakingPoolId/change-display', 'StakingPoolController.changeDisplay');

  //snapshot user balance
  Route.get('pool/:campaignId/user-snapshot-balance', 'CampaignController.userSnapShotBalance');

}).prefix(Const.USER_TYPE_PREFIX.ICO_OWNER)
//.middleware(['typeAdmin', 'checkPrefix', 'auth:admin', 'checkAdminJwtSecret']);

Route.group(() => {
  // Auth
  Route.post('/login', 'AuthAdminController.login').validator('Login').middleware('checkSignature');
  // Route.post('/register', 'AuthAdminController.adminRegister').validator('Register').middleware('checkSignature');
  // Route.get('confirm-email/:token', 'AdminController.confirmEmail'); // Confirm email when register
  // Route.post('forgot-password', 'AdminController.forgotPassword').validator('ForgotPassword').middleware('checkSignature');
  Route.get('check-wallet-address', 'AuthAdminController.checkWalletAddress');
  Route.post('check-wallet-address', 'AuthAdminController.checkWalletAddress');
  Route.get('check-token/:token', 'AdminController.checkToken');
  Route.post('reset-password/:token', 'AdminController.resetPassword').validator('ResetPassword').middleware('checkSignature');

}).prefix(Const.USER_TYPE_PREFIX.ICO_OWNER).middleware(['typeAdmin', 'checkPrefix', 'formatEmailAndWallet']);

Route.group(() => {
  Route.get('profile', 'AdminController.profile').middleware(['auth:admin', 'checkRole']);
  Route.post('change-password', 'AdminController.changePassword').middleware(['checkSignature', 'auth:admin', 'checkRole']);
  Route.post('update-profile', 'AdminController.updateProfile').middleware(['auth:admin', 'checkRole']).validator('UpdateProfile');
  Route.post('transaction-create', 'TransactionController.transactionAdd').middleware(['auth:admin']);

  Route.get('users', 'UserController.userList').middleware(['auth:admin']);
  Route.get('users/reload', 'UserController.reloadCachedUserData').middleware(['auth:admin']);

  Route.get('admins', 'AdminController.adminList').middleware(['auth:admin']);
  Route.get('admins/:id', 'AdminController.adminDetail').middleware(['auth:admin']);
  Route.post('admins', 'AdminController.create').middleware(['auth:admin']);
  Route.put('admins/:id', 'AdminController.update').middleware(['auth:admin']);


  Route.get('kyc-users', 'UserController.kycUserList').middleware(['auth:admin']);
  Route.get('kyc-users/:id', 'UserController.kycUserDetail').middleware(['auth:admin']);
  Route.post('kyc-users', 'UserController.kycUserCreate').middleware(['auth:admin']);
  Route.put('kyc-users/:id', 'UserController.kycUserUpdate').middleware(['auth:admin']);
  Route.put('kyc-users/:id/change-kyc', 'UserController.kycUserChangeIsKyc').middleware(['auth:admin']);

  Route.post('deposit-admin', 'CampaignController.depositAdmin').middleware(['auth:admin']);
}).prefix(Const.USER_TYPE_PREFIX.ICO_OWNER).middleware(['typeAdmin', 'checkPrefix', 'checkAdminJwtSecret']); //user/public



// Investor User
Route.get('campaign-latest-active', 'CampaignController.campaignLatestActive')

Route.group(() => {
  Route.post('/login', 'UserAuthController.login').validator('Login').middleware('checkSignature');
  Route.post('/register', 'UserAuthController.register').validator('Register').middleware('checkSignature');
  Route.post('/register-email', 'UserAuthController.registerVerifyEmail').middleware('checkSignature');

  Route.get('confirm-email/:token', 'UserController.confirmEmail'); // Confirm email when register
  Route.get('check-wallet-address', 'UserAuthController.checkWalletAddress');
  Route.post('check-wallet-address', 'UserAuthController.checkWalletAddress');
  Route.get('check-token/:token', 'UserController.checkToken');
  Route.post('reset-password/:token', 'UserController.resetPassword').validator('ResetPassword').middleware('checkSignature');
  Route.get('profile', 'UserController.profile').middleware(['maskEmailAndWallet']);
  Route.get('tier-info', 'UserController.tierInfo').middleware(['maskEmailAndWallet']);
  Route.put('update-profile', 'UserController.updateProfile').middleware(['checkSignature']);
  Route.post('check-active', 'UserController.checkUserActive');

  Route.post('join-campaign', 'CampaignController.joinCampaign').middleware(['checkSignature']);
  Route.post('unjoin-campaign', 'CampaignController.unJoinCampaign').middleware(['checkSignature']);
  Route.get('check-canceled-campaign', 'CampaignController.checkCancelCampaign').middleware(['maskEmailAndWallet']);
  Route.post('deposit', 'CampaignController.deposit').middleware(['checkSignature']);
  Route.post('claim', 'CampaignController.claim').middleware(['checkSignature']);
  Route.get('whitelist-search/:campaignId', 'WhiteListUserController.search');
  Route.get('whitelist-apply/previous', 'WhiteListSubmissionController.getPreviousWhitelistSubmission');
  Route.get('whitelist-apply/:campaignId', 'WhiteListSubmissionController.getWhitelistSubmission');
  Route.post('whitelist-apply/:campaignId', 'WhiteListSubmissionController.addWhitelistSubmission').middleware(['checkSignature']);
  Route.get('winner-list/:campaignId', 'WinnerListUserController.getWinnerListPublic').middleware(['maskEmailAndWallet']);
  Route.get('winner-search/:campaignId', 'WinnerListUserController.search').middleware(['maskEmailAndWallet']);
  Route.get('counting/:campaignId', 'CampaignController.countingJoinedCampaign');
  Route.get('check-join-campaign/:campaignId', 'CampaignController.checkJoinedCampaign');

  Route.get('test', 'WhiteListUserController.getWhiteList');

  Route.get('get-airdrop/:campaignId/:walletAddress', 'CampaignController.getAirdrop');
  Route.post('pre-order', 'CampaignController.preOrder').middleware(['checkSignature']);

}).prefix(Const.USER_TYPE_PREFIX.PUBLIC_USER).middleware(['typeUser', 'checkPrefix', 'formatEmailAndWallet']);// , 'maskEmailAndWallet'

Route.post(':type/check-max-usd', 'UserBuyCampaignController.checkBuy')
  .middleware(['checkPrefix', 'auth', 'checkJwtSecret']);

// Public API:
Route.group(() => {
  // Route.post('/login', 'UserAuthController.login');
  // Route.post('/logout', 'UserAuthController.logout');
  // subscribe notification
  Route.post('/subscribe-notification', 'UserDeviceController.subscribeNotification');
  // Route.post('/register', 'UserAuthController.register');
  

  Route.get('pools', 'PoolController.getPoolList');
  Route.get('pools/top-pools', 'PoolController.getTopPools');
  Route.get('pools/user/:walletAddress/joined-pools', 'PoolController.getJoinedPools');
  Route.get('pools/user/:walletAddress/all-pools-status', 'PoolController.getAllPoolsStatus');

  // Pool List V2
  Route.get('pools/v2/upcoming-pools', 'PoolController.getUpcomingPools');
  Route.get('pools/v2/featured-pools', 'PoolController.getFeaturedPools');

  // Pool List V3
  Route.get('pools/v3/active-pools', 'PoolController.getActivePoolsV3');
  Route.get('pools/v3/next-to-launch-pools', 'PoolController.getNextToLaunchPoolsV3');
  Route.get('pools/v3/upcoming-pools', 'PoolController.getUpcomingPoolsV3');
  Route.get('pools/v3/complete-sale-pools', 'PoolController.getCompleteSalePoolsV3');

  Route.get('pool/:campaignId', 'PoolController.getPoolPublic');
  Route.get('pool/:campaignId/tiers', 'TierController.getTiers');
  Route.get('pool/:campaignId/winners', 'WinnerListUserController.getWinnerAndReserveList');
  Route.get('pool/:campaignId/user/:walletAddress/current-tier', 'UserController.getCurrentTier');
  Route.post('user/check-email-verified', 'UserController.checkEmailVerified');
  Route.get('pool/:campaignId/check-exist-winner', 'WinnerListUserController.checkExistWinner').validator('CheckUserWinnerExist');
  Route.get('pool/:campaignId/check-picked-winner', 'WinnerListUserController.checkPickedWinner');

  // Staking Pool
  Route.get('staking-pool', 'StakingPoolController.getPublicPoolList');

  // Claim Config
  Route.get('pool/:campaignId/claim-configs', 'ClaimConfigController.getListClaimConfig');
  Route.get('pool/:campaignId/user/:walletAddress/claimable-amount', 'ClaimConfigController.getClaimableAmount');

  Route.get('reputation/points/:walletAddress', 'ReputationController.getReputationPoint');
  Route.get('reputation/histories/:walletAddress', 'ReputationController.getReputationHistory');
  Route.get('get-rate-setting', 'RateSettingController.getRateSetting');
  Route.get('get-tiers', 'TierSettingController.getTierSetting');

})
//.middleware(['maskEmailAndWallet']);

// Test API:
Route.get('api/v1/epkf/bonus', 'UserController.getEPkfBonusBalance');
Route.post('add_fake_user/:campaign_id/:tier', 'FakeUserController.insertMany');
// Route.get('test/run-pool-status', 'PoolController.poolStatus');

// API V2
// Route.get('dashboard/graph/:campaign', 'RevenueController.getRevenue').middleware(['checkIcoOwner', 'checkJwtSecret', 'auth']);

// Route.get('latest-transaction', 'TransactionController.latestTransaction')
// Route.get('public-campaign', 'CampaignController.myCampaign')
// Route.get('public-campaign/:status', 'CampaignController.myCampaign').middleware('checkPublicStatus')
// Route.post('user/change-type', 'UserController.changeType').validator('ChangeUserType')
// Route.post('user/buy', 'UserBuyCampaignController.getUserBuy').validator('CheckUserBought')
// Route.get('coming-soon', 'ConfigController.getConfig')


