import {
  Staked as StakedEvent,
  UnStaked as UnStakedEvent,
  RewardClaimed as RewardClaimedEvent,
  CommunityLevelUpdated as CommunityLevelUpdatedEvent,
} from "../generated/InvitationRewards/InvitationRewards"
import {
  UserInviteeList,
  UsersStateRanking
} from "../generated/schema"
import { ZERO_BD, ZONE_ADDRESS } from "./helpers"
import { handleUpdateGovernanceData, handleAccountUpdateData } from './dayUpdates'
import { handleUpdateUsersStateRankingsLevel, handleUpdateWeekTypeListInvite, handleUodateAccountLearns  } from './delegatesTransfer'

export function handleStaked(event: StakedEvent): void {
  let id = event.params.staker.toHexString()
  let entity = UserInviteeList.load(id)
  if (!entity) {
    entity = new UserInviteeList(id)
    entity.account = event.params.staker
    entity.amount = ZERO_BD
    entity.createAt = event.block.timestamp
    entity.inviter = event.params._referrer
  }
  let amount = entity.amount
  amount = amount.plus(event.params.amount)
  entity.amount = amount
  entity.save()
}

export function handleUnStaked(event: UnStakedEvent): void {
  let id = event.params.staker.toHexString()
  if (event.params._referrer.notEqual(ZONE_ADDRESS)) {
    let listItem:UserInviteeList = UserInviteeList.load(id) as UserInviteeList
    let amount = listItem.amount
    amount = amount.minus(event.params.amount)
    listItem.amount = amount

    listItem.save()
  }
}

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  let entityAccount = handleAccountUpdateData(event.params.account)
  let invitationAmount = event.params.amount
  entityAccount.invitationTotal = entityAccount.invitationTotal.plus(invitationAmount)
  entityAccount.save()
  handleUpdateWeekTypeListInvite(event)
}

export function handleCommunityLevelUpdated(event: CommunityLevelUpdatedEvent): void {

  let entity = handleUpdateUsersStateRankingsLevel(event, event.params.user)
  entity.currentCommunity = event.params.newLevel
  entity.save()

  let entityGData =  handleUpdateGovernanceData(event)
  let totalWeek =  entityGData.totalWeekType
  if (totalWeek.notEqual(ZERO_BD)) {
    handleUodateAccountLearns(event, event.params.user)
  }
}