#!/usr/bin/env node
import { Command } from "commander";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const program = new Command();

const RPC_URL = process.env.RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const OWNER_ADDRESS =
  process.env.OWNER_ADDRESS || "0xEfc5859335A58d64A5e8E01d02c5241c852CBD40";
const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS || "0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091";

const STETH_ADDRESS = process.env.STETH_ADDRESS || "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const WSTETH_ADDRESS = process.env.WSTETH_ADDRESS || "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0";
const PERMIT2_ADDRESS = process.env.PERMIT2_ADDRESS || "";
const SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS || "";

if (!RPC_URL || !PRIVATE_KEY) {
  throw new Error("Missing RPC_URL or PRIVATE_KEY in .env");
}

const erc20Abi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)"
];

const permit2Abi = [
  "function approve(address token, address spender, uint160 amount, uint48 expiration) external",
  "function transferFrom(address from, address to, uint160 amount, address token) external",
];

const swapRouterAbi = [
  "function exactInputSingle(tuple(address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)",
];

async function getCtx() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const me = await signer.getAddress();
  return { provider, signer, me };
}

async function getToken(tokenAddress: string, signer: ethers.Wallet) {
  return new ethers.Contract(tokenAddress, erc20Abi, signer);
}

async function getDecimals(tokenAddress: string, signer: ethers.Wallet) {
  const token = await getToken(tokenAddress, signer);
  return Number(await token.decimals());
}

async function printInfo(tokenAddress: string, signer: ethers.Wallet, owner: string) {
  const token = await getToken(tokenAddress, signer);
  const [name, symbol, decimals, balance] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.balanceOf(owner),
  ]);

  console.log(
    JSON.stringify(
      {
        tokenAddress,
        name,
        symbol,
        decimals: decimals.toString(),
        owner,
        balance: ethers.formatUnits(balance, decimals),
      },
      null,
      2
    )
  );
}

async function transferToken(
  tokenAddress: string,
  signer: ethers.Wallet,
  to: string,
  amount: string
) {
  const token = await getToken(tokenAddress, signer);
  const d = await getDecimals(tokenAddress, signer);
  const tx = await token.transfer(to, ethers.parseUnits(amount, d));
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("Transfer confirmed!");
}

async function approveToken(
  tokenAddress: string,
  signer: ethers.Wallet,
  spender: string,
  amount: string
) {
  const token = await getToken(tokenAddress, signer);
  const d = await getDecimals(tokenAddress, signer);
  const tx = await token.approve(spender, ethers.parseUnits(amount, d));
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("Approve confirmed!");
}

async function allowanceToken(
  tokenAddress: string,
  signer: ethers.Wallet,
  owner: string,
  spender: string
) {
  const token = await getToken(tokenAddress, signer);
  const d = await getDecimals(tokenAddress, signer);
  const allowance = await token.allowance(owner, spender);
  console.log("Allowance:", ethers.formatUnits(allowance, d));
}

async function transferFromToken(
  tokenAddress: string,
  signer: ethers.Wallet,
  from: string,
  to: string,
  amount: string
) {
  const token = await getToken(tokenAddress, signer);
  const d = await getDecimals(tokenAddress, signer);
  const tx = await token.transferFrom(from, to, ethers.parseUnits(amount, d));
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("TransferFrom confirmed!");
}

async function sendMax(tokenAddress: string, signer: ethers.Wallet, to: string, owner: string) {
  const token = await getToken(tokenAddress, signer);
  const bal = await token.balanceOf(owner);
  const tx = await token.transfer(to, bal);
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("SendMax confirmed! Sent:", ethers.formatUnits(bal, await token.decimals()));
}

async function permit2Approve(
  signer: ethers.Wallet,
  tokenAddress: string,
  spender: string,
  amount: string
) {
  if (!PERMIT2_ADDRESS) throw new Error("Missing PERMIT2_ADDRESS in .env");
  const permit2 = new ethers.Contract(PERMIT2_ADDRESS, permit2Abi, signer);
  const d = await getDecimals(tokenAddress, signer);
  const tx = await permit2.approve(
    tokenAddress,
    spender,
    ethers.parseUnits(amount, d),
    Math.floor(Date.now() / 1000) + 3600
  );
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("Permit2 approve confirmed!");
}

async function permit2TransferFrom(
  signer: ethers.Wallet,
  tokenAddress: string,
  from: string,
  to: string,
  amount: string
) {
  if (!PERMIT2_ADDRESS) throw new Error("Missing PERMIT2_ADDRESS in .env");
  const permit2 = new ethers.Contract(PERMIT2_ADDRESS, permit2Abi, signer);
  const d = await getDecimals(tokenAddress, signer);
  const tx = await permit2.transferFrom(from, to, ethers.parseUnits(amount, d), tokenAddress);
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("Permit2 transferFrom confirmed!");
}

async function swapExactInputSingle(
  signer: ethers.Wallet,
  tokenIn: string,
  tokenOut: string,
  fee: number,
  amountInHuman: string
) {
  if (!SWAP_ROUTER_ADDRESS) throw new Error("Missing SWAP_ROUTER_ADDRESS in .env");
  const router = new ethers.Contract(SWAP_ROUTER_ADDRESS, swapRouterAbi, signer);

  const token = await getToken(tokenIn, signer);
  const decimals = Number(await token.decimals());
  const amountIn = ethers.parseUnits(amountInHuman, decimals);

  const me = await signer.getAddress();
  const allowance = await token.allowance(me, SWAP_ROUTER_ADDRESS);

  if (allowance < amountIn) {
    const approveTx = await token.approve(SWAP_ROUTER_ADDRESS, amountIn);
    console.log("approve tx:", approveTx.hash);
    await approveTx.wait();
  }

  const params = {
    tokenIn,
    tokenOut,
    fee,
    recipient: me,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };

  const tx = await router.exactInputSingle(params);
  console.log("swap tx:", tx.hash);
  await tx.wait();
  console.log("Swap confirmed!");
}

async function main() {
  program.name("lido-cli").description("CLI for Lido Stake Pro contract operations").version("1.0.0");

  program
    .command("info")
    .description("Show token metadata and OWNER balance")
    .option("-t, --token <address>", "Token address", CONTRACT_ADDRESS)
    .action(async (opts) => {
      const { signer } = await getCtx();
      await printInfo(opts.token, signer, OWNER_ADDRESS);
    });

  program
    .command("balance")
    .description("Show token balance for an address")
    .requiredOption("-t, --token <address>")
    .option("-o, --owner <address>", "Owner address", OWNER_ADDRESS)
    .action(async (opts) => {
      const { signer } = await getCtx();
      const token = await getToken(opts.token, signer);
      const d = await getDecimals(opts.token, signer);
      const bal = await token.balanceOf(opts.owner);
      console.log("Balance:", ethers.formatUnits(bal, d));
    });

  program
    .command("allowance")
    .description("Show allowance")
    .requiredOption("-t, --token <address>")
    .requiredOption("-s, --spender <address>")
    .option("-o, --owner <address>", "Owner address", OWNER_ADDRESS)
    .action(async (opts) => {
      const { signer } = await getCtx();
      await allowanceToken(opts.token, signer, opts.owner, opts.spender);
    });

  program
    .command("transfer")
    .description("Transfer tokens")
    .requiredOption("-t, --token <address>")
    .requiredOption("--to <address>")
    .requiredOption("--amount <amount>")
    .action(async (opts) => {
      const { signer } = await getCtx();
      await transferToken(opts.token, signer, opts.to, opts.amount);
    });

  program
    .command("approve")
    .description("Approve spender")
    .requiredOption("-t, --token <address>")
    .requiredOption("-s, --spender <address>")
    .requiredOption("--amount <amount>")
    .action(async (opts) => {
      const { signer } = await getCtx();
      await approveToken(opts.token, signer, opts.spender, opts.amount);
    });

  program
    .command("transfer-from")
    .description("Transfer using allowance")
    .requiredOption("-t, --token <address>")
    .requiredOption("--from <address>")
    .requiredOption("--to <address>")
    .requiredOption("--amount <amount>")
    .action(async (opts) => {
      const { signer } = await getCtx();
      await transferFromToken(opts.token, signer, opts.from, opts.to, opts.amount);
    });

  program
    .command("send-max")
    .description("Transfer full balance")
    .requiredOption("-t, --token <address>")
    .requiredOption("--to <address>")
    .option("-o, --owner <address>", "Owner address", OWNER_ADDRESS)
    .action(async (opts) => {
      const { signer } = await getCtx();
      await sendMax(opts.token, signer, opts.to, opts.owner);
    });

  program
    .command("permit2-approve")
    .description("Permit2 allowance approval")
    .requiredOption("-t, --token <address>")
    .requiredOption("-s, --spender <address>")
    .requiredOption("--amount <amount>")
    .action(async (opts) => {
      const { signer } = await getCtx();
      await permit2Approve(signer, opts.token, opts.spender, opts.amount);
    });

  program
    .command("permit2-transfer-from")
    .description("Permit2 transferFrom")
    .requiredOption("-t, --token <address>")
    .requiredOption("--from <address>")
    .requiredOption("--to <address>")
    .requiredOption("--amount <amount>")
    .action(async (opts) => {
      const { signer } = await getCtx();
      await permit2TransferFrom(signer, opts.token, opts.from, opts.to, opts.amount);
    });

  program
    .command("swap-exact-input-single")
    .description("Uniswap v3 exactInputSingle swap")
    .requiredOption("--token-in <address>")
    .requiredOption("--token-out <address>")
    .requiredOption("--fee <number>")
    .requiredOption("--amount-in <amount>")
    .action(async (opts) => {
      const { signer } = await getCtx();
      await swapExactInputSingle(signer, opts.tokenIn, opts.tokenOut, Number(opts.fee), opts.amountIn);
    });

  program
    .command("lido-info")
    .description("Show Lido token info")
    .action(async () => {
      const { signer } = await getCtx();
      if (STETH_ADDRESS) await printInfo(STETH_ADDRESS, signer, OWNER_ADDRESS);
      if (WSTETH_ADDRESS) await printInfo(WSTETH_ADDRESS, signer, OWNER_ADDRESS);
      if (!STETH_ADDRESS && !WSTETH_ADDRESS) {
        console.log("Set STETH_ADDRESS and/or WSTETH_ADDRESS in .env");
      }
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
