import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse } from '../../lib/api-response';
import { LoginInput, RegisterInput } from '../../lib/validations';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk<
  { user: User; token: string },
  LoginInput,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data: ApiResponse<{ user: User; token: string }> = await response.json();

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Login failed');
    }

    return data.data!;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const registerUser = createAsyncThunk<
  { user: User; token: string },
  RegisterInput,
  { rejectValue: string }
>('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data: ApiResponse<{ user: User; token: string }> = await response.json();

    if (!data.isSuccess) {
      return rejectWithValue(data.error || 'Registration failed');
    }

    return data.data!;
  } catch (error) {
    return rejectWithValue('Network error occurred');
  }
});

export const logoutUser = createAsyncThunk<void, void>('auth/logout', async () => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    // Even if logout fails on server, we clear local state
    console.error('Logout error:', error);
  }
});

export const checkAuthStatus = createAsyncThunk<
  User,
  void,
  { rejectValue: { type: 'auth' | 'user_not_found' | 'network'; message: string } }
>('auth/checkStatus', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/auth/me');
    const data: ApiResponse<User> = await response.json();

    if (!data.isSuccess || !data.data) {
      // Check if it's a user not found error (404) or auth error (401)
      if (response.status === 404) {
        return rejectWithValue({ 
          type: 'user_not_found', 
          message: data.error || 'User account no longer exists' 
        });
      } else if (response.status === 401) {
        return rejectWithValue({ 
          type: 'auth', 
          message: data.error || 'Not authenticated' 
        });
      }
      return rejectWithValue({ 
        type: 'auth', 
        message: data.error || 'Authentication failed' 
      });
    }

    return data.data;
  } catch (error) {
    return rejectWithValue({ 
      type: 'network', 
      message: 'Failed to check auth status' 
    });
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    forceLogout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
        state.user = null;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
        state.isAuthenticated = false;
        state.user = null;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;
      })
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
        
        // Handle different types of auth check failures
        const errorPayload = action.payload;
        console.log('Auth check rejected:', errorPayload);
        
        // For any auth failure, we want to clear the state completely
        // This ensures the UI will trigger a redirect
      });
  },
});

export const { clearError, setUser, clearAuth, forceLogout } = authSlice.actions;
export default authSlice.reducer;