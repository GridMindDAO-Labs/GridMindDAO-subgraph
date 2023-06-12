/* eslint-disable prefer-const */
import { Bytes, ethereum } from '@graphprotocol/graph-ts'
import { GMDCount, AccountHistoryCount } from '../generated/schema'
import { ZERO_BD } from './helpers'

export function handleUpdateGovernanceData(event: ethereum.Event):GMDCount {
  let entityGData = GMDCount.load(ZERO_BD.toString())
  if (!entityGData) {
    entityGData = new GMDCount(ZERO_BD.toString())
    entityGData.totalProposal = ZERO_BD
    entityGData.totalFinance = ZERO_BD
    entityGData.totalStaticFinancialRevenue = ZERO_BD
    entityGData.totalLiquidityRevenue = ZERO_BD
    entityGData.totalLiquidityVotes = ZERO_BD
    entityGData.totalLiquidityValidNewVotes = ZERO_BD
    entityGData.totalLiquidityValidNOldVotes = ZERO_BD
    entityGData.totalWeekType = ZERO_BD
  }
  entityGData.save()
  return entityGData as GMDCount
}


export function handleAccountUpdateData(account: Bytes):AccountHistoryCount {
  let entity = AccountHistoryCount.load(account.toHexString())
  if (!entity) {
    entity = new AccountHistoryCount(account.toHexString())
    entity.totalStaticFinancialRevenue = ZERO_BD
    entity.totalLiquidityRevenue = ZERO_BD
    entity.totalLiquidityVotes = ZERO_BD
    entity.starkingRewardEndAt = ZERO_BD
    entity.invitationTotal = ZERO_BD
  }
  entity.save()
  return entity as AccountHistoryCount
}