import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse } from '../../lib/api-response';
import { CreateWalletInput, CreateWalletEntryInput } from '../../lib/validations';
import apiClient from '../../lib/api-client';

export interface Wallet {
  _id: string;
  name: string;
  icon: string;
  backgroundColor: string;
  balance: number;
  userId: string;
  createdBy: string;
  userRole?: 'owner' | 'viewer' | 'partner'; // Role of current user for this wallet
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  _id: string;
  title: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletEntry {
  _id: string;
  amount: number;
  type: 'add' | 'subtract';
  description?: string;
  walletId: string;
  tags?: Tag[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletState {
  wallets: Wallet[];
  currentWallet: Wallet | null;
  walletEntries: WalletEntry[];
  deletedEntries: WalletEntry[];
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: WalletState = {
  wallets: [],
  currentWallet: null,
  walletEntries: [],
  deletedEntries: [],
  tags: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchWallets = createAsyncThunk<
  Wallet[],
  void,
  { rejectValue: string }
>('wallet/fetchWallets', async (_, { rejectWithValue }) => {
  try {
    const data: ApiResponse<Wallet[]> = await apiClient.get('/api/wallets', {
      useCache: true,
      cacheTtl: 2 * 60 * 1000, // Cache for 2 minutes
    });

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Failed to fetch wallets');
    }

    return data.data || [];
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Network error occurred');
  }
});

export const fetchWalletById = createAsyncThunk<
  Wallet,
  string,
  { rejectValue: string }
>('wallet/fetchWalletById', async (walletId, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/wallets/${walletId}`);
    const data: ApiResponse<Wallet> = await response.json();

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Failed to fetch wallet');
    }

    return data.data!;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const createWallet = createAsyncThunk<
  Wallet,
  CreateWalletInput,
  { rejectValue: string }
>('wallet/createWallet', async (walletData, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/wallets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(walletData),
    });

    const data: ApiResponse<Wallet> = await response.json();

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Failed to create wallet');
    }

    return data.data!;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const deleteWallet = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('wallet/deleteWallet', async (walletId, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/wallets/${walletId}`, {
      method: 'DELETE',
    });

    const data: ApiResponse<null> = await response.json();

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Failed to delete wallet');
    }

    return walletId;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const fetchTags = createAsyncThunk<
  Tag[],
  void,
  { rejectValue: string }
>('wallet/fetchTags', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/tags');
    const data: ApiResponse<Tag[]> = await response.json();

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Failed to fetch tags');
    }

    return data.data || [];
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const fetchWalletEntries = createAsyncThunk<
  { entries: WalletEntry[]; deletedEntries: WalletEntry[]; pagination: WalletState['pagination'] },
  { walletId: string; page?: number; limit?: number },
  { rejectValue: string }
>('wallet/fetchWalletEntries', async ({ walletId, page = 1, limit = 20 }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/wallets/${walletId}/entries?page=${page}&limit=${limit}`);
    const data: ApiResponse<{ entries: WalletEntry[]; deletedEntries: WalletEntry[]; pagination: WalletState['pagination'] }> = await response.json();

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Failed to fetch wallet entries');
    }

    return data.data!;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const createWalletEntry = createAsyncThunk<
  { entry: WalletEntry; updatedWallet: Wallet },
  { walletId: string; entryData: CreateWalletEntryInput },
  { rejectValue: string }
>('wallet/createWalletEntry', async ({ walletId, entryData }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/wallets/${walletId}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entryData),
    });

    const data: ApiResponse<{ entry: WalletEntry; updatedWallet: Wallet }> = await response.json();

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Failed to create wallet entry');
    }

    return data.data!;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const updateWalletEntry = createAsyncThunk<
  { entry: WalletEntry; updatedWallet: Wallet },
  { walletId: string; entryId: string; entryData: CreateWalletEntryInput },
  { rejectValue: string }
>('wallet/updateWalletEntry', async ({ walletId, entryId, entryData }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/wallets/${walletId}/entries/${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entryData),
    });

    const data: ApiResponse<{ entry: WalletEntry; updatedWallet: Wallet }> = await response.json();

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Failed to update wallet entry');
    }

    return data.data!;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const deleteWalletEntry = createAsyncThunk<
  { entry: WalletEntry; updatedWallet: Wallet },
  { walletId: string; entryId: string },
  { rejectValue: string }
>('wallet/deleteWalletEntry', async ({ walletId, entryId }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/wallets/${walletId}/entries/${entryId}`, {
      method: 'DELETE',
    });

    const data: ApiResponse<{ entry: WalletEntry; updatedWallet: Wallet }> = await response.json();

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Failed to delete wallet entry');
    }

    return data.data!;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const permanentDeleteWalletEntry = createAsyncThunk<
  { entryId: string },
  { walletId: string; entryId: string },
  { rejectValue: string }
>('wallet/permanentDeleteWalletEntry', async ({ walletId, entryId }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/wallets/${walletId}/entries/${entryId}/permanent`, {
      method: 'DELETE',
    });

    const data: ApiResponse<{ entryId: string }> = await response.json();

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Failed to permanently delete wallet entry');
    }

    return data.data!;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentWallet: (state, action: PayloadAction<Wallet | null>) => {
      state.currentWallet = action.payload;
    },
    clearWalletEntries: (state) => {
      state.walletEntries = [];
      state.pagination = initialState.pagination;
    },
    updateWalletBalance: (state, action: PayloadAction<{
      walletId: string;
      balance: number;
      updatedAt: string;
      preserveUserRole?: boolean;
    }>) => {
      const { walletId, balance, updatedAt, preserveUserRole = true } = action.payload;
      
      // Update wallet in wallets array
      const walletIndex = state.wallets.findIndex(w => w._id === walletId);
      if (walletIndex !== -1) {
        state.wallets[walletIndex] = {
          ...state.wallets[walletIndex],
          balance,
          updatedAt
        };
      }
      
      // Update current wallet if it matches - preserve all existing fields including userRole
      if (state.currentWallet && state.currentWallet._id === walletId) {
        state.currentWallet = {
          ...state.currentWallet,
          balance,
          updatedAt
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wallets
      .addCase(fetchWallets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWallets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wallets = action.payload;
        state.error = null;
      })
      .addCase(fetchWallets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch wallets';
        state.wallets = [];
      })
      // Fetch wallet by ID
      .addCase(fetchWalletById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWalletById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWallet = action.payload;
        state.error = null;
      })
      .addCase(fetchWalletById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch wallet';
        state.currentWallet = null;
      })
      // Create wallet
      .addCase(createWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wallets.push(action.payload);
        state.error = null;
      })
      .addCase(createWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create wallet';
      })
      // Delete wallet
      .addCase(deleteWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wallets = state.wallets.filter(wallet => wallet._id !== action.payload);
        // Clear current wallet if it was the deleted one
        if (state.currentWallet?._id === action.payload) {
          state.currentWallet = null;
        }
        state.error = null;
      })
      .addCase(deleteWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete wallet';
      })
      // Fetch tags
      .addCase(fetchTags.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tags = action.payload;
        state.error = null;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch tags';
      })
      // Fetch wallet entries
      .addCase(fetchWalletEntries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWalletEntries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.walletEntries = action.payload.entries;
        state.deletedEntries = action.payload.deletedEntries;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchWalletEntries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch wallet entries';
        state.walletEntries = [];
      })
      // Create wallet entry
      .addCase(createWalletEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createWalletEntry.fulfilled, (state, action) => {
        state.isLoading = false;
        state.walletEntries.unshift(action.payload.entry);
        state.currentWallet = action.payload.updatedWallet;
        // Update wallet in the wallets array if it exists
        const walletIndex = state.wallets.findIndex(w => w._id === action.payload.updatedWallet._id);
        if (walletIndex !== -1) {
          state.wallets[walletIndex] = action.payload.updatedWallet;
        }
        state.error = null;
      })
      .addCase(createWalletEntry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create wallet entry';
      })
      // Update wallet entry
      .addCase(updateWalletEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateWalletEntry.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the entry in the walletEntries array
        const entryIndex = state.walletEntries.findIndex(entry => entry._id === action.payload.entry._id);
        if (entryIndex !== -1) {
          state.walletEntries[entryIndex] = action.payload.entry;
        }
        // Update current wallet
        state.currentWallet = action.payload.updatedWallet;
        // Update wallet in the wallets array if it exists
        const walletIndex = state.wallets.findIndex(w => w._id === action.payload.updatedWallet._id);
        if (walletIndex !== -1) {
          state.wallets[walletIndex] = action.payload.updatedWallet;
        }
        state.error = null;
      })
      .addCase(updateWalletEntry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update wallet entry';
      })
      // Delete wallet entry (soft delete)
      .addCase(deleteWalletEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteWalletEntry.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the entry from active entries and add to deleted entries
        const entryIndex = state.walletEntries.findIndex(entry => entry._id === action.payload.entry._id);
        if (entryIndex !== -1) {
          state.walletEntries.splice(entryIndex, 1);
        }
        state.deletedEntries.unshift(action.payload.entry);
        // Update current wallet
        state.currentWallet = action.payload.updatedWallet;
        // Update wallet in the wallets array if it exists
        const walletIndex = state.wallets.findIndex(w => w._id === action.payload.updatedWallet._id);
        if (walletIndex !== -1) {
          state.wallets[walletIndex] = action.payload.updatedWallet;
        }
        state.error = null;
      })
      .addCase(deleteWalletEntry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete wallet entry';
      })
      // Permanent delete wallet entry
      .addCase(permanentDeleteWalletEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(permanentDeleteWalletEntry.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the entry from deleted entries
        const entryIndex = state.deletedEntries.findIndex(entry => entry._id === action.payload.entryId);
        if (entryIndex !== -1) {
          state.deletedEntries.splice(entryIndex, 1);
        }
        state.error = null;
      })
      .addCase(permanentDeleteWalletEntry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to permanently delete wallet entry';
      });
  },
});

export const { clearError, setCurrentWallet, clearWalletEntries, updateWalletBalance } = walletSlice.actions;
export default walletSlice.reducer;