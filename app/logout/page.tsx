'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography, Space } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../store/hooks';
import { forceLogout } from '../../store/slices/authSlice';
import { forceLogoutAndRedirect, clearAuthData } from '../../lib/auth-utils';

const { Title, Paragraph } = Typography;

export const dynamic = 'force-dynamic';

export default function LogoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Auto logout on page load
    handleLogout();
  }, []);

  const handleLogout = async () => {
    try {
      // Clear Redux state
      dispatch(forceLogout());
      
      // Clear all auth data and redirect
      await forceLogoutAndRedirect('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if cleanup fails
      router.replace('/auth');
    }
  };

  const handleManualClear = () => {
    clearAuthData();
    dispatch(forceLogout());
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <LogoutOutlined className="text-4xl text-gray-400 mb-4" />
          <Title level={3}>Logging Out...</Title>
          <Paragraph className="text-gray-600 mb-6">
            Clearing your session and redirecting to login...
          </Paragraph>
          
          <Space direction="vertical" className="w-full">
            <Button 
              type="primary" 
              size="large" 
              onClick={handleLogout}
              className="w-full"
            >
              Retry Logout
            </Button>
            
            <Button 
              size="large" 
              onClick={handleManualClear}
              className="w-full"
            >
              Force Clear & Redirect
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}