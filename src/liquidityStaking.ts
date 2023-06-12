import {
  Deposited as DepositedEvent,
  Withdrawn as WithdrawnEvent,
  RewardClaimed as RewardClaimedEvent,
} from "../generated/LiquidityStaking/LiquidityStaking"
import {
  RateUpdated,
  DepositedList
} from "../generated/schema"
import { ZERO_BD, ONE_BI } from './helpers'
import { handleUpdateGovernanceData,handleAccountUpdateData } from './dayUpdates'
import { handleUpdateDelegatesList, handleUpdateWeekTypeListLiquidityStaking } from './delegatesTransfer'

export function handleDeposited(event: DepositedEvent): void {
  let entityOrderHash = event.params.positionId.toHexString()
  let entity = DepositedList.load(entityOrderHash)
  if (!entity) {
    entity = new DepositedList(entityOrderHash)
    entity.gmdTokenRevenues = ZERO_BD
    entity.isRedeem = false
    entity.amount = ZERO_BD
    entity.governanceVotes = ZERO_BD
  }
  let amount = entity.amount.plus(event.params.amount)
  entity.governanceVotes = amount
  entity.account = event.params.account
  entity.nftTokenId = event.params.tokenId
  entity.liquiditesAmount = event.params.liquidity
  entity.amount = amount
  entity.token = event.address
  entity.orderHash = event.params.positionId
  entity.maturityAt = event.block.timestamp
  entity.createAt = event.block.timestamp
  entity.save()

  let entityGData =  handleUpdateGovernanceData(event)
  entityGData.totalFinance = entityGData.totalFinance.plus(ONE_BI)
  entityGData.totalLiquidityVotes = entityGData.totalLiquidityVotes.plus(event.params.amount)
  entityGData.save()

  let entityAccount = handleAccountUpdateData(event.params.account)
  entityAccount.totalLiquidityVotes = entityAccount.totalLiquidityVotes.plus(event.params.amount)
  entityAccount.save()

  // 委托票权--存入自动添加
  let entityDelegates = handleUpdateDelegatesList(event.params.account)
  entityDelegates.account = event.params.account
  entityDelegates.gmdTokenAmount = entityDelegates.gmdTokenAmount.plus(amount)
  let delegateAddress = entityDelegates.delegateAddress
  if (delegateAddress.equals(event.params.account)) {
    if (entityDelegates.isDelegate) {
      entityDelegates.walletVotes = entityDelegates.walletVotes.plus(event.params.amount)
      entityDelegates.save()
    }
    entityDelegates.save()
  } 
  entityDelegates.save()
}

export function handleWithdrawn(event: WithdrawnEvent): void {
  let entityOrderHash = event.params.positionId.toHexString()
  let listItem:DepositedList = DepositedList.load(entityOrderHash) as DepositedList
  listItem.isRedeem = true
  listItem.save()

  let entityGData =  handleUpdateGovernanceData(event)
  let entityAccount = handleAccountUpdateData(event.params.account)

  entityGData.totalLiquidityVotes = entityGData.totalLiquidityVotes.minus(event.params.amount)
  
  entityAccount.totalLiquidityVotes = entityAccount.totalLiquidityVotes.minus(event.params.amount)

  // 用户赎回票权，移除被委托人的票权
  let delegatesItem = handleUpdateDelegatesList(event.params.account)
  delegatesItem.gmdTokenAmount = delegatesItem.gmdTokenAmount.minus(event.params.amount)
  if (delegatesItem.isDelegate && delegatesItem.walletVotes.notEqual(ZERO_BD)) {
    delegatesItem.walletVotes = delegatesItem.walletVotes.minus(event.params.amount)
    delegatesItem.save()
  }
  delegatesItem.save()

  entityAccount.save()
  entityGData.save()
}

export function handleRewardClaimed(event: RewardClaimedEvent):void {
  let entityGData =  handleUpdateGovernanceData(event)
  let entityAccount = handleAccountUpdateData(event.params.account)

  entityGData.totalLiquidityRevenue = entityGData.totalLiquidityRevenue.plus(event.params.amount)
  entityAccount.totalLiquidityRevenue = entityAccount.totalLiquidityRevenue.plus(event.params.amount)
  
  entityGData.save()
  entityAccount.save()

  handleUpdateWeekTypeListLiquidityStaking(event)
}