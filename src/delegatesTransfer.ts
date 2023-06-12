import { Bytes, BigInt, BigDecimal, ethereum, log } from "@graphprotocol/graph-ts"
import { DelegatesList, UsersStateRanking, WeekTypeList } from "../generated/schema"
import { ZERO_BD, DAYS_TIME, DAYS_START, WEEK_BI, ZONE_ADDRESS, ONE_BI, ZERO_BD_, DAYS_START_Block } from "./helpers"

import { Withdrawn as WithdrawnEvent } from "../generated/Financing/Financing"
import { RewardClaimed as RewardClaimedEvent } from "../generated/LiquidityStaking/LiquidityStaking"
import { 
  CommunityLevelUpdated as  CommunityLevelUpdatedEvent,
  RewardClaimed as RewardClaimedInviteEvent,
} from "../generated/InvitationRewards/InvitationRewards"
import { RewardClaimed as RewardClaimedPoolEvent } from "../generated/StakingRewards/StakingRewards"

import { handleUpdateGovernanceData } from "./dayUpdates"

export function handleUpdateDelegatesList(address: Bytes): DelegatesList {
  let delegates = DelegatesList.load(address.toHexString())
  if (!delegates) {
    delegates = new DelegatesList(address.toHexString())
    delegates.account = address
    delegates.delegateAddress = address
    delegates.isDelegate = false
    delegates.totalVotes = ZERO_BD
    delegates.walletVotes = ZERO_BD
    delegates.gmdTokenAmount = ZERO_BD
  }
  return delegates as DelegatesList
}

export function handleUpdateUsersStateRanking(event: WithdrawnEvent):UsersStateRanking {
  let timestamp = event.block.timestamp.toI32()
  let dayID =  BigInt.fromI32(timestamp).minus(DAYS_START).div(DAYS_TIME)
  let week = dayID.div(WEEK_BI)
  let entityId = week.toString()
    .concat('-')
    .concat(event.params.account.toHexString())
  let entity = UsersStateRanking.load(entityId)
  if (!entity) {
    entity = new UsersStateRanking(entityId)
    entity.account = event.params.account
    entity.amount = ZERO_BD
    entity.inviter = ZONE_ADDRESS
    entity.weekType = week.plus(ONE_BI)
    entity.createAt = event.block.timestamp
    entity.rankingRewards = ZERO_BD_
    entity.currentCommunity = ZERO_BD
  }
  return entity as UsersStateRanking
}

export function handleUpdateUsersStateRankingsLevel(event: CommunityLevelUpdatedEvent, account: Bytes):UsersStateRanking {
  let timestamp = event.block.timestamp.toI32()
  let dayID =  BigInt.fromI32(timestamp).minus(DAYS_START).div(DAYS_TIME)
  let week = dayID.div(WEEK_BI)
  let entityId = week.toString()
    .concat('-')
    .concat(account.toHexString())

  let entity = UsersStateRanking.load(entityId)
  if (!entity) {
    entity = new UsersStateRanking(entityId)
    entity.account = account
    entity.amount = ZERO_BD
    entity.inviter = ZONE_ADDRESS
    entity.weekType = week.plus(ONE_BI)
    entity.createAt = event.block.timestamp
    entity.rankingRewards = ZERO_BD_
    entity.currentCommunity = ZERO_BD
  }
  return entity as UsersStateRanking
}


export function handleUpdateUsersStateRankings(event: WithdrawnEvent, account: Bytes):UsersStateRanking {
  let timestamp = event.block.timestamp.toI32()
  let dayID =  BigInt.fromI32(timestamp).minus(DAYS_START).div(DAYS_TIME)
  let week = dayID.div(WEEK_BI)
  let entityId = week.toString()
    .concat('-')
    .concat(account.toHexString())

  let entity = UsersStateRanking.load(entityId)
  if (!entity) {
    entity = new UsersStateRanking(entityId)
    entity.account = account
    entity.amount = ZERO_BD
    entity.inviter = ZONE_ADDRESS
    entity.weekType = week.plus(ONE_BI)
    entity.createAt = event.block.timestamp
    entity.rankingRewards = ZERO_BD_
    entity.currentCommunity = ZERO_BD
  }
  return entity as UsersStateRanking
}

/** 28天理财3%奖励统计 */
export function handleUpdateWeekTypeListFor(event: WithdrawnEvent): BigInt {
  let timestamp = event.block.timestamp.toI32()
  let diffWeek = BigInt.fromI32(timestamp).minus(DAYS_START).div(DAYS_TIME).div(WEEK_BI)
  let rankingRewards = event.params.interest.toBigDecimal().div(BigDecimal.fromString('0.65')).times(BigDecimal.fromString('0.03'))
  let at = WEEK_BI.times(DAYS_TIME)
  let at_block = at.div(BigInt.fromI32(3))

  let entityGData =  handleUpdateGovernanceData(event)
  entityGData.totalWeekType = diffWeek.plus(ONE_BI)
  entityGData.save()

  for (let i = 0; i <= diffWeek.toI32(); i++) {
    let entitys = handleUpdateWeekTypeList(BigInt.fromI32(i))
    entitys.startAt = DAYS_START.plus(at.times(BigInt.fromI32(i)))
    entitys.endAt = DAYS_START.plus(at.times(BigInt.fromI32(i+1)))
    entitys.startBlock = DAYS_START_Block.plus(at_block.times(BigInt.fromI32(i)))
    entitys.endBlock = DAYS_START_Block.plus(at_block.times(BigInt.fromI32(i+1)))
    if (diffWeek.toI32() == i) {
      entitys.totalRankingRewards = entitys.totalRankingRewards.plus(rankingRewards)
      entitys.totalFinancingRewards = entitys.totalFinancingRewards.plus(rankingRewards)
      entitys.save()
    }
    entitys.save()
  }
  
  return diffWeek
}

/** 流动性理财3%奖励统计 */
export function handleUpdateWeekTypeListLiquidityStaking(event: RewardClaimedEvent): BigInt {
  let timestamp = event.block.timestamp.toI32()
  let diffWeek = BigInt.fromI32(timestamp).minus(DAYS_START).div(DAYS_TIME).div(WEEK_BI)
  let rankingRewards = event.params.amount.toBigDecimal().div(BigDecimal.fromString('0.85')).times(BigDecimal.fromString('0.03'))
  let at = WEEK_BI.times(DAYS_TIME)
  let at_block = at.div(BigInt.fromI32(3))

  let entityGData =  handleUpdateGovernanceData(event)
  entityGData.totalWeekType = diffWeek.plus(ONE_BI)
  entityGData.save()

  for (let i = 0; i <= diffWeek.toI32(); i++) {
    let entitys = handleUpdateWeekTypeList(BigInt.fromI32(i))
    entitys.startAt = DAYS_START.plus(at.times(BigInt.fromI32(i)))
    entitys.endAt = DAYS_START.plus(at.times(BigInt.fromI32(i+1)))
    entitys.startBlock = DAYS_START_Block.plus(at_block.times(BigInt.fromI32(i)))
    entitys.endBlock = DAYS_START_Block.plus(at_block.times(BigInt.fromI32(i+1)))
    if (diffWeek.toI32() == i) {
      entitys.totalRankingRewards = entitys.totalRankingRewards.plus(rankingRewards)
      entitys.totalLiquidityRewards = entitys.totalLiquidityRewards.plus(rankingRewards)
      entitys.save()
    }
    entitys.save()
  }

  return diffWeek
}

function handleUpdateWeekTypeList(week: BigInt): WeekTypeList {
  let entity = WeekTypeList.load(week.toString())
  if (!entity) {
    entity = new WeekTypeList(week.toString())
    entity.weekType = week.plus(ONE_BI)
    entity.startAt = ZERO_BD
    entity.endAt = ZERO_BD
    entity.totalRankingRewards = ZERO_BD_

    entity.totalFinancingRewards = ZERO_BD_
    entity.totalInviteRewards = ZERO_BD_
    entity.totalLiquidityRewards = ZERO_BD_
    entity.totalStakingRewards = ZERO_BD_

    entity.startBlock = ZERO_BD
    entity.endBlock = ZERO_BD
  }
  return entity as WeekTypeList
}

/** 邀请收益，奖励3%统计 */
export function handleUpdateWeekTypeListInvite(event: RewardClaimedInviteEvent): BigInt {
  let timestamp = event.block.timestamp.toI32()
  let diffWeek = BigInt.fromI32(timestamp).minus(DAYS_START).div(DAYS_TIME).div(WEEK_BI)
  let rankingRewards = event.params.amount.toBigDecimal().div(BigDecimal.fromString('0.65')).times(BigDecimal.fromString('0.03'))
  let at = WEEK_BI.times(DAYS_TIME)
  let at_block = at.div(BigInt.fromI32(3))

  let entityGData =  handleUpdateGovernanceData(event)
  entityGData.totalWeekType = diffWeek.plus(ONE_BI)
  entityGData.save()

  for (let i = 0; i <= diffWeek.toI32(); i++) {
    let entitys = handleUpdateWeekTypeList(BigInt.fromI32(i))
    entitys.startAt = DAYS_START.plus(at.times(BigInt.fromI32(i)))
    entitys.endAt = DAYS_START.plus(at.times(BigInt.fromI32(i+1)))
    entitys.startBlock = DAYS_START_Block.plus(at_block.times(BigInt.fromI32(i)))
    entitys.endBlock = DAYS_START_Block.plus(at_block.times(BigInt.fromI32(i+1)))
    if (diffWeek.toI32() == i) {
      entitys.totalRankingRewards = entitys.totalRankingRewards.plus(rankingRewards)
      entitys.totalInviteRewards = entitys.totalInviteRewards.plus(rankingRewards)
      entitys.save()
    }
    entitys.save()
  }
  
  return diffWeek
}

/** 总奖池收益，奖励3%统计*/
export function handleUpdateWeekTypeListPool(event: RewardClaimedPoolEvent): BigInt {
  let timestamp = event.block.timestamp.toI32()
  let diffWeek = BigInt.fromI32(timestamp).minus(DAYS_START).div(DAYS_TIME).div(WEEK_BI)
  let rankingRewards = event.params.amount.toBigDecimal().div(BigDecimal.fromString('0.65')).times(BigDecimal.fromString('0.03'))
  let at = WEEK_BI.times(DAYS_TIME)
  let at_block = at.div(BigInt.fromI32(3))

  let entityGData =  handleUpdateGovernanceData(event)
  entityGData.totalWeekType = diffWeek.plus(ONE_BI)
  entityGData.save()

  for (let i = 0; i <= diffWeek.toI32(); i++) {
    let entitys = handleUpdateWeekTypeList(BigInt.fromI32(i))
    entitys.startAt = DAYS_START.plus(at.times(BigInt.fromI32(i)))
    entitys.endAt = DAYS_START.plus(at.times(BigInt.fromI32(i+1)))
    entitys.startBlock = DAYS_START_Block.plus(at_block.times(BigInt.fromI32(i)))
    entitys.endBlock = DAYS_START_Block.plus(at_block.times(BigInt.fromI32(i+1)))
    if (diffWeek.toI32() == i) {
      entitys.totalRankingRewards = entitys.totalRankingRewards.plus(rankingRewards)
      entitys.totalStakingRewards = entitys.totalStakingRewards.plus(rankingRewards)
      entitys.save()
    }
    entitys.save()
  }

  return diffWeek
}

/** 驱动某用户更新最新的周期 */
export function handleUodateAccountLearns(event: ethereum.Event,account: Bytes): BigInt {
  let entityGData =  handleUpdateGovernanceData(event)
  let totals =  entityGData.totalWeekType.minus(ONE_BI)

  for(let i = totals.toI32(); i >= 0; i--) {
    let levelsId = i.toString().concat('-').concat(account.toHexString())
    let entityLevels = UsersStateRanking.load(levelsId)
    if (entityLevels) {
      let oldLevels = ZERO_BD
      if(entityLevels.currentCommunity.equals(ZERO_BD)) {
        let isTrue = true
        let num = BigInt.fromI32(i).minus(ONE_BI)

        while(isTrue) {
          let levelsIds = num.toI32().toString().concat('-').concat(account.toHexString())
          let entityLevelss = UsersStateRanking.load(levelsIds)
          if (entityLevelss) {
            oldLevels = entityLevelss.currentCommunity
          }
          num = num.minus(ONE_BI)
          if (num.equals(ZERO_BD)) {
            isTrue = false
          }
          if (oldLevels.notEqual(ZERO_BD)) {
            isTrue = false
          }
        }

        entityLevels.currentCommunity = oldLevels
        entityLevels.save()
      }

    }
  }

  return totals
}