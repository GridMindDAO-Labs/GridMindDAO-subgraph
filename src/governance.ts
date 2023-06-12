import { Bytes,log } from "@graphprotocol/graph-ts"
import {
  ProposalCreated as ProposalCreatedEvent,
  VoteCast as VoteCastEvent,
} from "../generated/Governance/Governance"
import {
  ProposalsList,
  ForVotesInfo
} from "../generated/schema"
import {handleGovernanceState, ONE_BI } from './helpers'
import { handleUpdateGovernanceData } from './dayUpdates'
import { handleUpdateDelegatesList } from './delegatesTransfer'

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  let id = event.params.proposalId
  let entity = ProposalsList.load(id.toString())
  if (!entity) {
    entity = new ProposalsList(id.toString())
  }
  entity.proposalId = event.params.proposalId
  entity.proposer = event.params.proposer
  entity.targets = event.params.targets.map<Bytes>(item => item)
  entity.values = event.params.values
  entity.signatures = event.params.signatures
  entity.calldatas = event.params.calldatas
  entity.startBlock = event.params.startBlock
  entity.endBlock = event.params.endBlock
  entity.description = event.params.description

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.state = handleGovernanceState(event.params.proposalId, event.address)
  entity.forVotes = []
  
  entity.save()

  let entityGData =  handleUpdateGovernanceData(event)
  entityGData.totalProposal = entityGData.totalProposal.plus(ONE_BI)
  entityGData.save()
}

export function handleVoteCast(event: VoteCastEvent): void {
  let id = event.transaction.hash.concatI32(event.logIndex.toI32())

  let forEntity = ForVotesInfo.load(id.toHexString())
  if (!forEntity) {
    forEntity = new ForVotesInfo(id.toHexString())
  }

  forEntity.weight = event.params.weight
  forEntity.voter = event.params.voter
  forEntity.support = event.params.support === 1 ? true : false

  let listItem:ProposalsList = ProposalsList.load(event.params.proposalId.toString()) as ProposalsList
  let list = listItem.forVotes
  list.push(forEntity.id)
  listItem.forVotes = list
  
  forEntity.save()
  listItem.save()
}
