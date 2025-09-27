import type { Wallet } from '../store/slices/walletSlice';

export type WalletRole = 'owner' | 'viewer' | 'partner';

export interface WalletPermissions {
  canView: boolean;
  canAddEntry: boolean;
  canDeleteWallet: boolean;
  canManageAccess: boolean;
  canEditWallet: boolean;
}

/**
 * Get user permissions for a specific wallet based on their role
 */
export function getWalletPermissions(wallet: Wallet, currentUserId: string): WalletPermissions {
  const isOwner = wallet.createdBy === currentUserId;
  const userRole = isOwner ? 'owner' : (wallet.userRole || 'viewer');

  switch (userRole) {
    case 'owner':
      return {
        canView: true,
        canAddEntry: true,
        canDeleteWallet: true,
        canManageAccess: true,
        canEditWallet: true,
      };

    case 'partner':
      return {
        canView: true,
        canAddEntry: true,
        canDeleteWallet: false,
        canManageAccess: false,
        canEditWallet: false,
      };

    case 'viewer':
      return {
        canView: true,
        canAddEntry: false,
        canDeleteWallet: false,
        canManageAccess: false,
        canEditWallet: false,
      };

    default:
      return {
        canView: false,
        canAddEntry: false,
        canDeleteWallet: false,
        canManageAccess: false,
        canEditWallet: false,
      };
  }
}

/**
 * Check if user can perform a specific action on a wallet
 */
export function canPerformAction(
  wallet: Wallet, 
  currentUserId: string, 
  action: keyof WalletPermissions
): boolean {
  const permissions = getWalletPermissions(wallet, currentUserId);
  return permissions[action];
}

/**
 * Get user's role for a wallet
 */
export function getUserWalletRole(wallet: Wallet, currentUserId: string): WalletRole {
  const isOwner = wallet.createdBy === currentUserId;
  return isOwner ? 'owner' : (wallet.userRole || 'viewer');
}