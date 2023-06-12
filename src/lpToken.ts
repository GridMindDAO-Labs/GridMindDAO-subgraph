import { Bytes, log, store } from "@graphprotocol/graph-ts"
import {
  DelegateChanged as DelegateChangedEvent,
  DelegateVotesChanged as DelegateVotesChangedEvent
} from "../generated/LPToken/LPToken"
import { ZERO_BD } from "./helpers"
import { handleUpdateGovernanceData } from './dayUpdates'
import { handleUpdateDelegatesList } from './delegatesTransfer'


export function handleDelegateChanged(event: DelegateChangedEvent): void {
  let delegatesItem = handleUpdateDelegatesList(event.params.delegator)
  if (event.params.toDelegate.equals(event.params.delegator)) {
    delegatesItem.isDelegate = true
    delegatesItem.delegateAddress = event.params.toDelegate

    let gmdTokenAmount = delegatesItem.gmdTokenAmount
    delegatesItem.walletVotes = gmdTokenAmount

    delegatesItem.save()
  }
  if (event.params.toDelegate.notEqual(event.params.delegator)) {
    let delegatesItemVoteValid = handleUpdateDelegatesList(event.params.toDelegate)

    delegatesItem.walletVotes = ZERO_BD
    delegatesItem.delegateAddress = event.params.toDelegate

    delegatesItemVoteValid.save()
    delegatesItem.save()
  }
  delegatesItem.save()
}

export function handleDelegateVotesChanged(event: DelegateVotesChangedEvent): void {

  let newBalanceAmount = event.params.newBalance == ZERO_BD ? ZERO_BD : event.params.newBalance
  let previousBalanceAmount = event.params.previousBalance == ZERO_BD ? ZERO_BD : event.params.previousBalance
  let entityGData =  handleUpdateGovernanceData(event)
  entityGData.totalLiquidityValidNOldVotes = entityGData.totalLiquidityValidNOldVotes.plus(previousBalanceAmount)
  entityGData.totalLiquidityValidNewVotes = entityGData.totalLiquidityValidNewVotes.plus(newBalanceAmount)

  let delegates = handleUpdateDelegatesList(event.params.delegate)
  delegates.totalVotes = newBalanceAmount

  delegates.save()
  entityGData.save()
}