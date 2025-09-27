'use client';

import { useEffect } from 'react';
import { Typography, Row, Col, Empty, Spin, Alert, Statistic, Card as AntCard, Divider } from 'antd';
import { WalletOutlined, UserOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchWallets, clearError } from '../../store/slices/walletSlice';
import WalletCard from '../../components/WalletCard';
import CreateWalletButton from '../../components/CreateWalletButton';
import { useWalletUpdates } from '../../hooks/useWalletUpdates';

const { Title, Paragraph } = Typography;

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { wallets, isLoading, error } = useAppSelector((state) => state.wallet);
  const { user } = useAppSelector((state) => state.auth);

  // Enable live wallet updates
  useWalletUpdates(true);

  useEffect(() => {
    dispatch(fetchWallets());
  }, [dispatch]);

  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(absAmount);
    
    return isNegative ? `-${formatted}` : formatted;
  };

  // Separate personal and shared wallets
  const personalWallets = wallets.filter(w => !w.userRole || w.userRole === 'owner');
  const sharedWallets = wallets.filter(w => w.userRole && w.userRole !== 'owner');

  // Calculate statistics for each section
  const personalBalance = personalWallets.reduce((total, wallet) => total + wallet.balance, 0);
  const sharedBalance = sharedWallets.reduce((total, wallet) => total + wallet.balance, 0);
  const totalBalance = personalBalance + sharedBalance;

  if (isLoading && wallets.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <Spin size="large" />
          <Paragraph className="mt-4 text-gray-600">Loading your wallets...</Paragraph>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title level={2} className="!mb-2">
            Welcome back, {user?.name}! {user?.avatar || '👋'}
          </Title>
          <Paragraph className="text-gray-600 !mb-0">
            Manage your digital wallets and track your finances
          </Paragraph>
        </div>
        <div className="mt-4 sm:mt-0">
          <CreateWalletButton />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => dispatch(clearError())}
        />
      )}

      {/* Overall Statistics */}
      {wallets.length > 0 && (
        <div className="mb-8">
          <Title level={4} className="mb-4 text-gray-700">
            Portfolio Overview
          </Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <AntCard>
                <Statistic
                  title="Total Balance"
                  value={formatCurrency(totalBalance)}
                  valueStyle={{ 
                    color: totalBalance >= 0 ? '#3f8600' : '#cf1322',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}
                  prefix={<WalletOutlined />}
                />
              </AntCard>
            </Col>
            <Col xs={8} sm={6}>
              <AntCard>
                <Statistic
                  title="Total Wallets"
                  value={wallets.length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </AntCard>
            </Col>
            <Col xs={8} sm={6}>
              <AntCard>
                <Statistic
                  title="Personal"
                  value={personalWallets.length}
                  valueStyle={{ color: '#722ed1' }}
                />
              </AntCard>
            </Col>
            <Col xs={8} sm={6}>
              <AntCard>
                <Statistic
                  title="Shared"
                  value={sharedWallets.length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </AntCard>
            </Col>
          </Row>
        </div>
      )}

      {/* Wallets Sections */}
      {wallets.length === 0 ? (
        <div className="text-center py-12">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Paragraph className="text-gray-500 mb-4">
                  You don&apos;t have any wallets yet
                </Paragraph>
                <CreateWalletButton />
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Personal Wallets Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <UserOutlined className="text-blue-600" />
                <Title level={4} className="!mb-0">
                  Personal Wallets
                </Title>
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-medium">
                  {personalWallets.length}
                </span>
              </div>
              <CreateWalletButton />
            </div>
            
            {/* Personal Wallets Statistics */}
            {personalWallets.length > 0 && (
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={8}>
                  <AntCard size="small">
                    <Statistic
                      title="Personal Balance"
                      value={formatCurrency(personalBalance)}
                      valueStyle={{ 
                        color: personalBalance >= 0 ? '#3f8600' : '#cf1322',
                        fontSize: '20px',
                        fontWeight: 'bold'
                      }}
                      prefix={<WalletOutlined />}
                    />
                  </AntCard>
                </Col>
                <Col xs={12} sm={8}>
                  <AntCard size="small">
                    <Statistic
                      title="Owned Wallets"
                      value={personalWallets.length}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </AntCard>
                </Col>
                <Col xs={12} sm={8}>
                  <AntCard size="small">
                    <Statistic
                      title="Avg. Balance"
                      value={personalWallets.length > 0 ? formatCurrency(personalBalance / personalWallets.length) : '$0.00'}
                      valueStyle={{ color: '#666' }}
                    />
                  </AntCard>
                </Col>
              </Row>
            )}
            
            {/* Personal Wallets Grid */}
            {personalWallets.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Paragraph className="text-gray-500 mb-4">
                  You haven&apos;t created any wallets yet
                </Paragraph>
                <CreateWalletButton />
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {personalWallets.map((wallet) => (
                  <Col key={wallet._id} xs={24} sm={12} lg={8} xl={6}>
                    <WalletCard wallet={wallet} />
                  </Col>
                ))}
              </Row>
            )}
          </div>

          {/* Shared Wallets Section */}
          {sharedWallets.length > 0 && (
            <>
              <Divider />
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <ShareAltOutlined className="text-green-600" />
                  <Title level={4} className="!mb-0">
                    Shared Wallets
                  </Title>
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm font-medium">
                    {sharedWallets.length}
                  </span>
                </div>
                
                {/* Shared Wallets Statistics */}
                <Row gutter={[16, 16]} className="mb-6">
                  <Col xs={24} sm={8}>
                    <AntCard size="small">
                      <Statistic
                        title="Shared Balance"
                        value={formatCurrency(sharedBalance)}
                        valueStyle={{ 
                          color: sharedBalance >= 0 ? '#3f8600' : '#cf1322',
                          fontSize: '20px',
                          fontWeight: 'bold'
                        }}
                        prefix={<ShareAltOutlined />}
                      />
                    </AntCard>
                  </Col>
                  <Col xs={12} sm={8}>
                    <AntCard size="small">
                      <Statistic
                        title="Shared Wallets"
                        value={sharedWallets.length}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </AntCard>
                  </Col>
                  <Col xs={12} sm={8}>
                    <AntCard size="small">
                      <Statistic
                        title="Partner Access"
                        value={sharedWallets.filter(w => w.userRole === 'partner').length}
                        suffix={`/ ${sharedWallets.length}`}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </AntCard>
                  </Col>
                </Row>
                
                {/* Shared Wallets Grid */}
                <Row gutter={[16, 16]}>
                  {sharedWallets.map((wallet) => (
                    <Col key={wallet._id} xs={24} sm={12} lg={8} xl={6}>
                      <WalletCard wallet={wallet} />
                    </Col>
                  ))}
                </Row>
              </div>
            </>
          )}
        </div>
      )}

      {/* Loading indicator for additional requests */}
      {isLoading && wallets.length > 0 && (
        <div className="text-center py-4">
          <Spin />
        </div>
      )}
    </div>
  );
}