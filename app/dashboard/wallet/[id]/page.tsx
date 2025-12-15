'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Typography, 
  Button, 
  Card, 
  Table, 
  Tag, 
  Statistic, 
  Row, 
  Col, 
  Space, 
  Spin, 
  Alert, 
  Empty,
  Breadcrumb,
  Badge 
} from 'antd';
import { 
  ArrowLeftOutlined, 
  WalletOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  CalendarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
import { 
  fetchWalletById, 
  fetchWalletEntries, 
  clearError 
} from '../../../../store/slices/walletSlice';
import AddEntryButton from '../../../../components/AddEntryButton';
import DeleteWalletButton from '../../../../components/DeleteWalletButton';
import ShareWalletButton from '../../../../components/ShareWalletButton';
import ManageAccessButton from '../../../../components/ManageAccessButton';
import EditEntryButton from '../../../../components/EditEntryButton';
import DeleteEntryButton from '../../../../components/DeleteEntryButton';
import PermanentDeleteEntryButton from '../../../../components/PermanentDeleteEntryButton';
import type { WalletEntry } from '../../../../store/slices/walletSlice';
import { formatTransactionDate, formatDateForDisplay } from '../../../../lib/timezone';
import { getTextColor } from '../../../../lib/color-utils';

const { Title, Text, Paragraph } = Typography;

export default function WalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentWallet, walletEntries, deletedEntries, isLoading, error, pagination } = useAppSelector((state) => state.wallet);
  console.info("🚀 ~ WalletDetailPage ~ currentWallet:", currentWallet)
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const walletId = params.id as string;

  useEffect(() => {
    if (walletId) {
      dispatch(fetchWalletById(walletId));
      dispatch(fetchWalletEntries({ walletId, page: 1, limit: 20 }));
    }
  }, [dispatch, walletId]);

  useEffect(() => {
    if (walletId && currentPage > 1) {
      dispatch(fetchWalletEntries({ walletId, page: currentPage, limit: 20 }));
    }
  }, [dispatch, walletId, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = async () => {
    if (!walletId) return;
    
    setIsRefreshing(true);
    try {
      // Refresh both wallet details and entries
      await Promise.all([
        dispatch(fetchWalletById(walletId)),
        dispatch(fetchWalletEntries({ walletId, page: currentPage, limit: 20 }))
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount: number, showSign = false) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(absAmount);
    
    if (showSign) {
      return isNegative ? `-${formatted}` : `+${formatted}`;
    }
    return isNegative ? `-${formatted}` : formatted;
  };

  const formatDate = (dateString: string) => {
    return {
      date: formatDateForDisplay(dateString),
      time: formatTransactionDate(dateString).split(' at ')[1] || 'N/A',
    };
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: 'add' | 'subtract') => (
        <Tag 
          color={type === 'add' ? 'green' : 'red'}
          icon={type === 'add' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        >
          {type === 'add' ? 'Credit' : 'Debit'}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number, record: WalletEntry) => (
        <Text 
          className={`font-semibold ${record.type === 'add' ? 'text-green-600' : 'text-red-600'}`}
        >
          {formatCurrency(amount, true)}
        </Text>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string | undefined) => (
        <Text className="text-gray-600">
          {description || <em>No description</em>}
        </Text>
      ),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 180,
      render: (tags: any[]) => (
        <div className="flex flex-wrap gap-1">
          {tags && tags.length > 0 ? (
            tags.map((tag: any) => (
              <Tag
                key={tag._id}
                color="blue"
                className="text-xs"
                style={{ margin: '1px', fontSize: '11px' }}
              >
                {tag.emoji} {tag.title}
              </Tag>
            ))
          ) : (
            <Text type="secondary" className="text-xs italic">No tags</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (createdAt: string) => {
        const { date, time } = formatDate(createdAt);
        return (
          <div>
            <div className="text-sm font-medium">{date}</div>
            <div className="text-xs text-gray-500">{time}</div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: WalletEntry) => (
        <Space size="small">
          <EditEntryButton
            entry={record}
            walletId={walletId}
            userRole={currentWallet?.userRole}
            onSuccess={handleRefresh}
          />
          <DeleteEntryButton
            entry={record}
            walletId={walletId}
            userRole={currentWallet?.userRole}
            onSuccess={handleRefresh}
          />
        </Space>
      ),
    },
  ];

  if (isLoading && !currentWallet) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <Spin size="large" />
          <Paragraph className="mt-4 text-gray-600">Loading wallet details...</Paragraph>
        </div>
      </div>
    );
  }

  if (!currentWallet && !isLoading) {
    return (
      <div className="text-center py-12">
        <Empty
          description="Wallet not found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <Breadcrumb.Item>
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/dashboard')}
            className="!px-0"
          >
            Dashboard
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <WalletOutlined className="mr-1" />
          {currentWallet?.name}
        </Breadcrumb.Item>
      </Breadcrumb>

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

      {/* Wallet Header */}
      <Card className="overflow-hidden" bodyStyle={{ padding: 0 }}>
        <div 
          className="p-6"
          style={{ 
            backgroundColor: currentWallet?.backgroundColor || '#3B82F6',
            color: getTextColor(currentWallet?.backgroundColor || '#3B82F6')
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                <span className="text-4xl">{currentWallet?.icon || '💰'}</span>
              </div>
              <div>
                <Title 
                  level={2} 
                  className="!mb-1"
                  style={{ color: getTextColor(currentWallet?.backgroundColor || '#3B82F6') }}
                >
                  {currentWallet?.name}
                  {currentWallet?.userRole !== 'owner' && currentWallet?.userRole && (
                    <Tag 
                      className="ml-2 capitalize" 
                      color={currentWallet.userRole === 'partner' ? 'green' : 'blue'}
                    >
                      {currentWallet.userRole}
                    </Tag>
                  )}
                </Title>
                <Text 
                  className="opacity-80"
                  style={{ color: getTextColor(currentWallet?.backgroundColor || '#3B82F6') }}
                >
                  <CalendarOutlined className="mr-1" />
                  Created {currentWallet && formatDateForDisplay(currentWallet.createdAt)}
                  {currentWallet?.userRole !== 'owner' && (
                    <span className="ml-2">• Shared wallet</span>
                  )}
                </Text>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Only show Add Entry for owners and partners */}
              {currentWallet?.userRole !== 'viewer' && (
                <AddEntryButton 
                  walletId={walletId}
                  walletName={currentWallet?.name || ''}
                  variant="button"
                  size="large"
                />
              )}
              
              {/* Only show Share, Manage Access and Delete for owners */}
              {currentWallet?.userRole === 'owner' && (
                <>
                  <ShareWalletButton
                    walletId={walletId}
                    walletName={currentWallet?.name || ''}
                    size="large"
                  />
                  <ManageAccessButton
                    walletId={walletId}
                    walletName={currentWallet?.name || ''}
                    size="large"
                  />
                  <DeleteWalletButton
                    wallet={currentWallet}
                    variant="danger"
                    size="large"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Current Balance"
              value={currentWallet ? formatCurrency(currentWallet.balance) : '$0.00'}
              valueStyle={{ 
                color: currentWallet && currentWallet.balance >= 0 ? '#3f8600' : '#cf1322',
                fontSize: '28px',
                fontWeight: 'bold'
              }}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={pagination.total}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="Status"
              value={currentWallet && currentWallet.balance >= 0 ? 'Positive' : 'Deficit'}
              valueStyle={{ 
                color: currentWallet && currentWallet.balance >= 0 ? '#3f8600' : '#cf1322',
                fontSize: '16px'
              }}
              formatter={(value) => (
                <Tag color={currentWallet && currentWallet.balance >= 0 ? 'green' : 'red'}>
                  {value}
                </Tag>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Transaction History */}
      <Card 
        title={
          <Space>
            <CalendarOutlined />
            Transaction History
          </Space>
        }
        extra={
          <Space>
            <Text className="text-gray-500">
              {pagination.total} total transaction{pagination.total !== 1 ? 's' : ''}
            </Text>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={isRefreshing}
              size="small"
              type="default"
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          rowKey="_id"
          dataSource={walletEntries}
          loading={isLoading || isRefreshing}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} transactions`,
            showSizeChanger: false,
            onChange: handlePageChange,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Paragraph>No transactions yet</Paragraph>
                    {currentWallet?.userRole !== 'viewer' && (
                      <AddEntryButton 
                        walletId={walletId}
                        walletName={currentWallet?.name || ''}
                        variant="button"
                        size="middle"
                      />
                    )}
                  </div>
                }
              />
            ),
          }}
        />
      </Card>

      {/* Deleted Entries Section */}
      {deletedEntries && deletedEntries.length > 0 && (
        <Card
          title={
            <Space>
              <Text className="text-gray-600">🗑️ Deleted Entries</Text>
              <Badge count={deletedEntries.length} />
            </Space>
          }
          className="bg-gray-50"
        >
          <Table
            columns={[
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
                width: 100,
                render: (type: 'add' | 'subtract') => (
                  <Tag 
                    color={type === 'add' ? 'green' : 'red'}
                    icon={type === 'add' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  >
                    {type === 'add' ? 'Credit' : 'Debit'}
                  </Tag>
                ),
              },
              {
                title: 'Amount',
                dataIndex: 'amount',
                key: 'amount',
                width: 120,
                render: (amount: number, record: WalletEntry) => (
                  <Text 
                    className={`font-semibold ${record.type === 'add' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(amount, true)}
                  </Text>
                ),
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
                ellipsis: true,
                render: (description: string | undefined) => (
                  <Text className="text-gray-600">
                    {description || <em>No description</em>}
                  </Text>
                ),
              },
              {
                title: 'Tags',
                dataIndex: 'tags',
                key: 'tags',
                width: 180,
                render: (tags: any[]) => (
                  <div className="flex flex-wrap gap-1">
                    {tags && tags.length > 0 ? (
                      tags.map((tag: any) => (
                        <Tag
                          key={tag._id}
                          color="blue"
                          className="text-xs"
                          style={{ margin: '1px', fontSize: '11px' }}
                        >
                          {tag.emoji} {tag.title}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary" className="text-xs italic">No tags</Text>
                    )}
                  </div>
                ),
              },
              {
                title: 'Deleted At',
                dataIndex: 'deletedAt',
                key: 'deletedAt',
                width: 160,
                render: (deletedAt: string) => {
                  const { date, time } = formatDate(deletedAt);
                  return (
                    <div>
                      <div className="text-sm font-medium text-red-600">{date}</div>
                      <div className="text-xs text-red-400">{time}</div>
                    </div>
                  );
                },
              },
              {
                title: 'Actions',
                key: 'actions',
                width: 120,
                render: (_: any, record: WalletEntry) => (
                  <PermanentDeleteEntryButton
                    entry={record}
                    walletId={walletId}
                    userRole={currentWallet?.userRole}
                    onSuccess={handleRefresh}
                  />
                ),
              },
            ]}
            dataSource={deletedEntries}
            rowKey="_id"
            size="small"
            pagination={false}
            locale={{
              emptyText: <Empty description="No deleted entries" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            }}
          />
        </Card>
      )}
    </div>
  );
}