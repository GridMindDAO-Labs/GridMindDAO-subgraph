import {
  OrderCreated as OrderCreatedEvent,
  RewardClaimed as RewardClaimedEvent
} from "../generated/StakingRewards/StakingRewards"
import { handleDepositedMaturityAt } from './helpers'
import { handleAccountUpdateData } from './dayUpdates'
import { handleUpdateWeekTypeListPool } from './delegatesTransfer'

export function handleOrderCreated(event:OrderCreatedEvent):void {
  let entityAccount = handleAccountUpdateData(event.params.user)
  entityAccount.starkingRewardEndAt = handleDepositedMaturityAt(event.block.timestamp)
  entityAccount.save()
}

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  handleUpdateWeekTypeListPool(event)
}