import bs58check from "bs58check";
import { env } from "@/lib/env";

// USDT TRC-20 contract: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
const USDT_TRC20_CONTRACT_HEX = "41a614f803b6fd780986a42c78ec9c7f77e6ded13c";

function tronBase58ToHex(address: string) {
  const decoded = bs58check.decode(address);
  return Buffer.from(decoded).toString("hex");
}

function tronBase58ToEvmParam(address: string) {
  // TRON base58check decodes to 21 bytes: 0x41 + 20-byte address.
  const bytes = bs58check.decode(address);
  const evm20 = Buffer.from(bytes).subarray(1); // drop 0x41
  return evm20.toString("hex").padStart(64, "0");
}

export async function getTrc20UsdtBalance(addressBase58?: string) {
  const addr = addressBase58 ?? env.MERCHANT_WALLET_ADDRESS;
  if (!addr) return 0;

  const ownerHex = tronBase58ToHex(addr);
  const param = tronBase58ToEvmParam(addr);

  const res = await fetch("https://api.trongrid.io/wallet/triggerconstantcontract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      owner_address: ownerHex,
      contract_address: USDT_TRC20_CONTRACT_HEX,
      function_selector: "balanceOf(address)",
      parameter: param,
      visible: false,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    // If TronGrid rate-limits, we fail soft (agent endpoint must not break).
    return 0;
  }

  const json = (await res.json()) as { constant_result?: string[] };
  const hex = json.constant_result?.[0];
  if (!hex) return 0;

  const raw = BigInt(`0x${hex}`);
  const balance = Number(raw) / 1_000; // USDT has 6 decimals
  return Number.isFinite(balance) ? balance : 0;
}

