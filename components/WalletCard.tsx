'use client';

import { Card, Typography, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { Wallet } from '../store/slices/walletSlice';
import { formatDateForDisplay } from '../lib/timezone';
import { getTextColor } from '../lib/color-utils';
import DeleteWalletButton from './DeleteWalletButton';

const { Title, Text } = Typography;

interface WalletCardProps {
  wallet: Wallet;
}

export default function WalletCard({ wallet }: WalletCardProps) {
  const router = useRouter();

  const formatBalance = (balance: number) => {
    const isNegative = balance < 0;
    const absBalance = Math.abs(balance);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(absBalance);

    return { formatted, isNegative };
  };

  const { formatted, isNegative } = formatBalance(wallet.balance);

  const handleViewWallet = () => {
    router.push(`/dashboard/wallet/${wallet._id}`);
  };

  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  const backgroundColor = wallet.backgroundColor || '#3B82F6';
  const textColor = getTextColor(backgroundColor);

  return (
    <Card
      className="h-full hover:shadow-lg transition-shadow duration-200 border border-gray-200 overflow-hidden"
      bodyStyle={{ padding: '0' }}
    >
      <div className="flex flex-col h-full">
        {/* Header with background color */}
        <div 
          className="p-4 pb-3 relative"
          style={{ backgroundColor, color: textColor }}
        >
          <div className="flex items-center space-x-3 mb-1">
            <span className="text-2xl">{wallet.icon || '💰'}</span>
            <Title 
              level={4} 
              className="!mb-0 truncate pr-8"
              style={{ color: textColor }}
            >
              {wallet.name}
            </Title>
          </div>
          {/* Role indicator for shared wallets */}
          {wallet.userRole && wallet.userRole !== 'owner' && (
            <div className="mt-1">
              <Tag 
                className="border-0 bg-white bg-opacity-20 backdrop-blur-sm capitalize text-xs"
                style={{ color: textColor }}
              >
                {wallet.userRole} access
              </Tag>
            </div>
          )}
          {/* Delete button in top-right corner - only for owners */}
          {(!wallet.userRole || wallet.userRole === 'owner') && (
            <div className="absolute top-2 right-2">
              <DeleteWalletButton 
                wallet={wallet} 
                variant="text" 
                size="small" 
                className="!p-1 opacity-60 hover:opacity-100"
              />
            </div>
          )}
        </div>
        
        {/* Content area with white background */}
        <div className="p-4 pt-3 flex-1 bg-white">
          {/* Balance */}
          <div className="mb-4">
            <Text className="text-sm text-gray-500 block mb-1">Current Balance</Text>
            <div className="flex items-center space-x-2">
              <Text
                className={`text-2xl font-bold ${
                  isNegative ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {isNegative ? '-' : ''}{formatted}
              </Text>
              <Tag color={isNegative ? 'red' : 'green'} className="!border-0">
                {isNegative ? 'Deficit' : 'Positive'}
              </Tag>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <Text className="text-xs text-gray-400">
                Created {formatDate(wallet.createdAt)}
              </Text>
            </div>
            
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={handleViewWallet}
              block
              size="large"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}