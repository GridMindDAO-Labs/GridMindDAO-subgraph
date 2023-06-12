import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import {
  Deposited as DepositedEvent,
  Withdrawn as WithdrawnEvent,
  SavingsRateUpdated as SavingsRateUpdatedEvent,
  UserPeriodFinishUpdated as UserPeriodFinishUpdatedEvent,
} from "../generated/Financing/Financing"
import {
  RateUpdated,
  DepositedList,
  UserInviteeList
} from "../generated/schema"
import { ZERO_BD, handleDepositedMaturityAt, ONE_BI, ZONE_ADDRESS } from './helpers'
import { handleUpdateGovernanceData, handleAccountUpdateData } from './dayUpdates'
import { handleUpdateUsersStateRanking, handleUpdateUsersStateRankings, handleUpdateWeekTypeListFor, handleUodateAccountLearns } from './delegatesTransfer'

export function handleDeposited(event: DepositedEvent): void {
  let entityOrderHash = event.params.orderHash.toHexString()
  let entity = DepositedList.load(entityOrderHash)
  if (!entity) {
    entity = new DepositedList(entityOrderHash)
    entity.gmdTokenRevenues = ZERO_BD
    entity.isRedeem = false
    entity.amount = ZERO_BD
    entity.governanceVotes = ZERO_BD
    entity.nftTokenId = ZERO_BD
    entity.liquiditesAmount = ZERO_BD
  }
  let amount = entity.amount.plus(event.params.amount)
  entity.account = event.params.account
  entity.amount = amount
  entity.token = event.params.token
  entity.orderHash = event.params.orderHash
  entity.maturityAt = handleDepositedMaturityAt(event.block.timestamp)
  entity.createAt = event.block.timestamp
  entity.save()

  let entityGData =  handleUpdateGovernanceData(event)
  entityGData.totalFinance = entityGData.totalFinance.plus(ONE_BI)
  entityGData.save()
}

export function handleWithdrawn(event: WithdrawnEvent): void {
  let entityOrderHash = event.params.orderHash.toHexString()
  let listItem:DepositedList = DepositedList.load(entityOrderHash) as DepositedList
  let gmdTokenRevenues = listItem.gmdTokenRevenues
  gmdTokenRevenues = gmdTokenRevenues.plus(event.params.interest)
  listItem.gmdTokenRevenues = gmdTokenRevenues
  listItem.isRedeem = event.params.amount != ZERO_BD ? true: false
  listItem.save()

  let entityGData =  handleUpdateGovernanceData(event)
  let entityAccount = handleAccountUpdateData(event.params.account)

  entityGData.totalStaticFinancialRevenue = entityGData.totalStaticFinancialRevenue.plus(event.params.interest)
  entityAccount.totalStaticFinancialRevenue = entityAccount.totalStaticFinancialRevenue.plus(event.params.interest)
  
  entityGData.save()
  entityAccount.save()

  let weekTotal =  handleUpdateWeekTypeListFor(event)

  let entityUsers = handleUpdateUsersStateRanking(event)
  let invEntity = UserInviteeList.load(event.params.account.toHexString()) as UserInviteeList
  let inviter = invEntity.inviter
  entityUsers.inviter = inviter
  let amount = entityUsers.amount.plus(event.params.interest)
  entityUsers.amount = amount
  entityUsers.rankingRewards = event.params.interest.toBigDecimal().div(BigDecimal.fromString('0.65')).times(BigDecimal.fromString('0.03'))
  entityUsers.save()

  if (inviter.notEqual(ZONE_ADDRESS)) {
    let inviters = inviter
    while(inviters.notEqual(ZONE_ADDRESS)) {
      let invEntitys = UserInviteeList.load(inviters.toHexString()) as UserInviteeList
      let entity = handleUpdateUsersStateRankings(event, invEntitys.account)
      entity.amount = entity.amount.plus(event.params.interest)
      entity.save()
      handleUodateAccountLearns(event, inviters)
      inviters = invEntitys.inviter
    }
  }
  if (weekTotal.notEqual(ZERO_BD)) {
    handleUodateAccountLearns(event, event.params.account)
  }
}

export function handleSavingsRateUpdated(event: SavingsRateUpdatedEvent): void {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let entityId = BigInt.fromI32(dayID).toString()
    .concat('-')
    .concat(event.params.token.toHexString())
  let entity = RateUpdated.load(entityId)
  if (!entity) {
    entity = new RateUpdated(entityId)
    entity.newRate = ZERO_BD
  }
  entity.date = BigInt.fromI32(dayStartTimestamp)
  entity.newRate = event.params.newRate
  entity.token = event.params.token
  entity.save()

}

export function handleUserPeriodFinishUpdated(event: UserPeriodFinishUpdatedEvent): void {
  let entityOrderHash = event.params.orderHash.toHexString()
  let listItem:DepositedList = DepositedList.load(entityOrderHash) as DepositedList
  listItem.maturityAt = event.params._periodFinish

  listItem.save()
}