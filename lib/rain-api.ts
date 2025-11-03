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
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  isTermsOfServiceAccepted: boolean;
  applicationStatus: ApplicationStatus;
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
 * Rain API client object with all available methods
 */
export const rainApi = {
  initiateUserApplication,
};

