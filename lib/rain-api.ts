/**
 * Rain API Client
 * 
 * This module provides utilities for interacting with the Rain Cards API.
 * API keys should NEVER be exposed in client-side code.
 */

const RAIN_API_KEY = process.env.RAIN_API_KEY;
const RAIN_API_BASE_URL = process.env.RAIN_API_BASE_URL || 'https://api-dev.raincards.xyz/v1';

if (!RAIN_API_KEY) {
  throw new Error('RAIN_API_KEY is not defined in environment variables');
}

/**
 * Base fetch wrapper for Rain API requests
 */
async function rainApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${RAIN_API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Api-Key': RAIN_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Rain API error (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

/**
 * Application Status enum
 */
export type ApplicationStatus = 
  | 'notStarted'
  | 'approved'
  | 'pending'
  | 'needsInformation'
  | 'needsVerification'
  | 'manualReview'
  | 'denied'
  | 'locked'
  | 'canceled';

/**
 * User application initiation request
 */
export interface InitiateUserApplicationRequest {
  firstName: string;
  lastName: string;
  email: string;
  walletAddress?: string;
}

/**
 * User application response
 */
export interface UserApplication {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  isTermsOfServiceAccepted?: boolean;
  applicationStatus: ApplicationStatus | 'notStarted' | 'needsVerification';
  companyId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  phoneCountryCode?: string;
  phoneNumber?: string;
  applicationExternalVerificationLink?: {
    url: string;
    params?: Record<string, string>;
  };
  applicationCompletionLink?: {
    url: string;
    params?: Record<string, string>;
  };
  applicationReason?: string;
}

/**
 * Initiate a consumer application for a user
 * 
 * @param data - User application data
 * @returns The created user application
 */
export async function initiateUserApplication(
  data: InitiateUserApplicationRequest
): Promise<UserApplication> {
  return rainApiFetch<UserApplication>('/issuing/applications/user/initiate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Card type enum
 */
export type CardType = 'physical' | 'virtual';

/**
 * Card status enum
 */
export type CardStatus = 
  | 'notActivated'
  | 'activated'
  | 'active'
  | 'locked'
  | 'canceled';

/**
 * Limit frequency enum
 */
export type LimitFrequency = 
  | 'per24HourPeriod'
  | 'per7DayPeriod'
  | 'per30DayPeriod'
  | 'perYear'
  | 'perYearPeriod'
  | 'allTime'
  | 'perAuthorization';

/**
 * Card limit
 */
export interface CardLimit {
  amount: number;
  frequency: LimitFrequency;
}

/**
 * Card configuration
 */
export interface CardConfiguration {
  displayName?: string;
  productId?: string;
  productRef?: string;
  virtualCardArt?: string;
}

/**
 * Address for billing or shipping
 */
export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  country?: string;
}

/**
 * Shipping address for physical cards
 */
export interface ShippingAddress extends Address {
  method?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Create card request
 */
export interface CreateCardRequest {
  type: CardType;
  status?: CardStatus;
  limit?: CardLimit;
  configuration?: CardConfiguration;
  billing?: Address;
  // Physical card fields (not used for virtual cards)
  shipping?: ShippingAddress;
  bulkShippingGroupId?: string;
}

/**
 * Card response
 */
export interface Card {
  id: string;
  companyId: string;
  userId: string;
  type: CardType;
  status: CardStatus;
  limit: CardLimit;
  last4: string;
  expirationMonth: string;
  expirationYear: string;
  tokenWallets: string[];
}

/**
 * Get a user application by user ID
 * 
 * @param userId - The user ID to get the application for
 * @returns The user application
 */
export async function getUserApplication(userId: string): Promise<UserApplication> {
  return rainApiFetch<UserApplication>(`/issuing/applications/user/${userId}`, {
    method: 'GET',
  });
}

/**
 * Create a card for a user
 * 
 * @param userId - The user ID to create the card for
 * @param data - Card creation data
 * @returns The created card
 */
export async function createCard(
  userId: string,
  data: CreateCardRequest
): Promise<Card> {
  return rainApiFetch<Card>(`/issuing/users/${userId}/cards`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get all cards for a user or company
 * 
 * @param options - Optional filters for userId or companyId
 * @returns Array of cards
 */
export async function getCards(options?: {
  userId?: string;
  companyId?: string;
}): Promise<Card[]> {
  const params = new URLSearchParams();
  if (options?.userId) {
    params.append('userId', options.userId);
  }
  if (options?.companyId) {
    params.append('companyId', options.companyId);
  }
  
  const queryString = params.toString();
  const endpoint = `/issuing/cards${queryString ? `?${queryString}` : ''}`;
  
  return rainApiFetch<Card[]>(endpoint, {
    method: 'GET',
  });
}

/**
 * Encrypted data object
 */
export interface EncryptedData {
  iv: string;
  data: string;
}

/**
 * Card encrypted secrets
 */
export interface CardSecrets {
  encryptedPan: EncryptedData;
  encryptedCvc: EncryptedData;
}

/**
 * Get a card's encrypted data (PAN and CVC)
 * 
 * @param cardId - The card ID to get encrypted data for
 * @param sessionId - Encrypted session ID generated by the user requesting the encrypted data
 * @returns The encrypted card secrets
 */
export async function getCardSecrets(
  cardId: string,
  sessionId: string
): Promise<CardSecrets> {
  return rainApiFetch<CardSecrets>(`/issuing/cards/${cardId}/secrets`, {
    method: 'GET',
    headers: {
      'SessionId': sessionId,
    },
  });
}

/**
 * Supported token for collateral
 */
export interface SupportedToken {
  address: string;
  balance?: string;
  exchangeRate?: number;
  advanceRate?: number;
  symbol?: string;
  decimals?: number;
  name?: string;
}

/**
 * Onramp virtual account information
 */
export interface OnrampAccount {
  beneficiaryName?: string;
  beneficiaryAddress?: string;
  beneficiaryBankName?: string;
  beneficiaryBankAddress?: string;
  accountNumber?: string;
  routingNumber?: string;
}

export interface Onramp {
  ach?: OnrampAccount;
  rtp?: OnrampAccount;
  wire?: OnrampAccount;
}

/**
 * User collateral contract
 */
export interface UserContract {
  id: string;
  chainId: number;
  controllerAddress?: string;
  proxyAddress: string;
  programAddress?: string; // Solana
  depositAddress?: string;
  tokens: SupportedToken[];
  contractVersion: number;
  onramp?: Onramp;
}

/**
 * Get user collateral contracts
 * 
 * @param userId - The user ID to get contracts for
 * @returns Array of user contracts
 */
export async function getUserContracts(userId: string): Promise<UserContract[]> {
  return rainApiFetch<UserContract[]>(`/issuing/users/${userId}/contracts`, {
    method: 'GET',
  });
}

/**
 * Create a smart contract for a user
 * 
 * @param userId - The user ID to create a contract for (must have EVM or Solana address)
 * @param chainId - The chain ID to create the contract on
 * @returns The created contract
 */
export async function createUserContract(
  userId: string,
  chainId: number
): Promise<UserContract> {
  return rainApiFetch<UserContract>(`/issuing/users/${userId}/contracts`, {
    method: 'POST',
    body: JSON.stringify({ chainId }),
  });
}

/**
 * User balance information
 */
export interface UserBalance {
  creditLimit: number;
  outstandingCharges?: number;
  balancesDue?: number;
  availableCredit?: number;
}

/**
 * Get user balances and credit limits
 * 
 * @param userId - The user ID to get balances for
 * @returns User balance information
 */
export async function getUserBalances(userId: string): Promise<UserBalance> {
  return rainApiFetch<UserBalance>(`/issuing/users/${userId}/balances`, {
    method: 'GET',
  });
}

/**
 * Withdrawal signature parameters
 */
export interface WithdrawalSignature {
  parameters: [
    string, // collateralProxy
    string, // assetAddress
    string, // amountInCents
    string, // recipient
    string, // expiresAt
    string, // executorPublisherSalt (base64 encoded)
    string, // executorPublisherSig
  ];
  status?: 'pending' | 'ready';
  waitSeconds?: number; // If status is pending, wait this many seconds before retrying
}

/**
 * Get withdrawal signature for collateral withdrawal
 * 
 * @param userId - The user ID to create withdrawal for
 * @param options - Withdrawal options
 * @returns Withdrawal signature and parameters
 */
export async function getWithdrawalSignature(
  userId: string,
  options: {
    token: string;
    amount: string; // Amount in cents
    recipientAddress: string;
    adminAddress: string;
    chainId: string;
  }
): Promise<WithdrawalSignature> {
  const params = new URLSearchParams();
  params.append('token', options.token);
  params.append('amount', options.amount);
  params.append('recipientAddress', options.recipientAddress);
  params.append('adminAddress', options.adminAddress);
  params.append('chainId', options.chainId);

  return rainApiFetch<WithdrawalSignature>(
    `/issuing/users/${userId}/signatures/withdrawals?${params.toString()}`,
    {
      method: 'GET',
    }
  );
}

/**
 * Rain API client object with all available methods
 */
export const rainApi = {
  initiateUserApplication,
  getUserApplication,
  createCard,
  getCards,
  getCardSecrets,
  getUserContracts,
  createUserContract,
  getUserBalances,
  getWithdrawalSignature,
};

