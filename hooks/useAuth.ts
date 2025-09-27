'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus, forceLogout } from '../store/slices/authSlice';
import { forceLogoutAndRedirect } from '../lib/auth-utils';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { 
    redirectTo = '/auth', 
    requireAuth = true 
  } = options;
  
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check auth status when component mounts if user is not authenticated
    if (!isAuthenticated && !user && requireAuth) {
      dispatch(checkAuthStatus()).unwrap().catch(async (error) => {
        // If checkAuthStatus fails (user not found, invalid token, etc.)
        console.log('Auth check failed, forcing logout:', error);
        dispatch(forceLogout());
        await forceLogoutAndRedirect(redirectTo);
      });
    }
  }, [dispatch, isAuthenticated, user, requireAuth, redirectTo]);

  useEffect(() => {
    // Handle authentication state changes - immediate redirect if not authenticated
    if (requireAuth && !isLoading && !isAuthenticated && !user) {
      console.log('User not authenticated, forcing logout and redirect');
      dispatch(forceLogout());
      forceLogoutAndRedirect(redirectTo);
    }
  }, [dispatch, isAuthenticated, user, isLoading, redirectTo, requireAuth]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || (!isAuthenticated && requireAuth && !user),
    shouldRedirect: requireAuth && !isLoading && !isAuthenticated && !user
  };
}

export function useAuthProtection() {
  return useAuthRedirect({ requireAuth: true, redirectTo: '/auth' });
}