'use client';

import { useEffect } from 'react';
import { Layout, Typography, Button, Space, Dropdown } from 'antd';
import { LogoutOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { useAuthProtection } from '../../hooks/useAuth';
import { forceLogoutAndRedirect } from '../../lib/auth-utils';
import NotificationPanel from '../../components/NotificationPanel';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, shouldRedirect } = useAuthProtection();

  // Timeout mechanism - if loading for more than 5 seconds, force logout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading && !isAuthenticated && !user) {
      timeoutId = setTimeout(async () => {
        console.log('Auth check timeout - forcing logout');
        await forceLogoutAndRedirect('/auth');
      }, 5000); // 5 second timeout
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, isAuthenticated, user]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/auth');
  };

  // Show loading while checking authentication
  if (isLoading || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <Text className="mt-4 text-gray-600">Loading...</Text>
        </div>
      </div>
    );
  }

  // If auth check completed but user is not authenticated, show nothing (will redirect)
  if (!isLoading && !isAuthenticated) {
    return null;
  }

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center h-full max-w-7xl mx-auto px-4">
          <div>
            <Title level={4} className="!mb-0 text-gray-800">
              Fake Wallet
            </Title>
          </div>
          <Space align="center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{user?.avatar || '😀'}</span>
              <Text className="text-gray-600">
                Welcome, {user?.name}
              </Text>
            </div>
            <NotificationPanel />
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    label: 'Profile Settings',
                    icon: <SettingOutlined />,
                    onClick: () => router.push('/dashboard/profile'),
                  },
                  {
                    type: 'divider',
                  },
                  {
                    key: 'logout',
                    label: 'Logout',
                    icon: <LogoutOutlined />,
                    onClick: handleLogout,
                    danger: true,
                  },
                ],
              }}
              trigger={['click']}
            >
              <Button
                type="text"
                icon={<UserOutlined />}
                className="flex items-center"
              >
                Account
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Header>
      <Content className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </div>
      </Content>
    </Layout>
  );
}