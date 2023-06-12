import { Address, BigInt, Bytes, BigDecimal } from '@graphprotocol/graph-ts'
import { Governance as GovernanceContract } from '../generated/Governance/Governance'

export let FOUR_BI = BigInt.fromI32(4)
export let ZERO_BD = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let WEEK_BI = BigInt.fromI32(10)

export let ZERO_BD_ = BigDecimal.fromString('0')
// 86400
let MODE_DAY_TIME = 86400
let MODE_DAY = 28

/**
 * Financing 30298835
 * InvitationRewards 30298831
 * LiquidityStaking 30298832
 * StakingRewards 30298830
 */
// 86400
export const DAYS_TIME = BigInt.fromI32(86400)
export const DAYS_START = BigInt.fromI32(1685590296)
export const DAYS_START_Block = BigInt.fromI32(30298830)

export let ZONE_ADDRESS = Bytes.fromHexString("0x0000000000000000000000000000000000000000")

export function handleGovernanceState(proposalId: BigInt, address: Address): BigInt {
  let governanceContract = GovernanceContract.bind(address)
  if (!governanceContract) {
    governanceContract = GovernanceContract.bind(address)
  }
  let state = governanceContract.state(proposalId)
  return BigInt.fromI32(state)
}

export function handleDepositedMaturityAt(createAt: BigInt): BigInt {
  let timestamp = createAt.toI32()
  let maturityTimes = timestamp + MODE_DAY_TIME * MODE_DAY
  return BigInt.fromI32(maturityTimes)
}
