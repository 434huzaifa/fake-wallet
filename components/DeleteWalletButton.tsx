'use client';

import { useState } from 'react';
import { Button, Modal, Typography, message } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteWallet } from '../store/slices/walletSlice';
import type { Wallet } from '../store/slices/walletSlice';

const { Text, Title } = Typography;

interface DeleteWalletButtonProps {
  wallet: Wallet;
  variant?: 'button' | 'danger' | 'text';
  size?: 'small' | 'middle' | 'large';
  className?: string;
}

export default function DeleteWalletButton({ 
  wallet, 
  variant = 'danger',
  size = 'middle',
  className = ''
}: DeleteWalletButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading } = useAppSelector((state) => state.wallet);

  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const result = await dispatch(deleteWallet(wallet._id));
      
      if (deleteWallet.fulfilled.match(result)) {
        message.success('Wallet deleted successfully!');
        setIsModalOpen(false);
        // Navigate back to dashboard
        router.push('/dashboard');
      } else {
        message.error(result.payload || 'Failed to delete wallet');
      }
    } catch {
      message.error('An error occurred while deleting the wallet');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        type={variant === 'danger' ? 'primary' : variant === 'text' ? 'text' : 'default'}
        danger={variant === 'danger' || variant === 'button'}
        icon={<DeleteOutlined />}
        onClick={handleDeleteClick}
        size={size}
        className={className}
        loading={isLoading}
        shape={variant === 'text' ? 'circle' : undefined}
      >
        {variant === 'text' ? '' : 'Delete Wallet'}
      </Button>

      <Modal
        title={
          <div className="flex items-center space-x-2 text-red-600">
            <ExclamationCircleOutlined className="text-xl" />
            <span>Delete Wallet</span>
          </div>
        }
        open={isModalOpen}
        onOk={handleConfirmDelete}
        onCancel={handleCancel}
        okText="Delete Wallet"
        cancelText="Cancel"
        okType="danger"
        confirmLoading={isLoading}
        width={500}
      >
        <div className="py-4">
          <Title level={4} className="!mb-2">
            Are you sure you want to delete &quot;{wallet.name}&quot;?
          </Title>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <Text className="text-red-800 font-medium block mb-2">
              ⚠️ This action cannot be undone!
            </Text>
            <Text className="text-red-700">
              Deleting this wallet will permanently remove:
            </Text>
            <ul className="mt-2 ml-4 text-red-700">
              <li>• The wallet and all its settings</li>
              <li>• All transaction entries in this wallet</li>
              <li>• All historical data</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <Text className="text-gray-600 text-sm">
              <strong>Wallet Details:</strong>
            </Text>
            <div className="mt-1 flex items-center space-x-2">
              <span className="text-lg">{wallet.icon}</span>
              <Text className="font-medium">{wallet.name}</Text>
            </div>
            <Text className="text-sm text-gray-500">
              Current Balance: {wallet.balance >= 0 ? '+' : ''}${Math.abs(wallet.balance).toFixed(2)}
            </Text>
          </div>

          <Text className="text-gray-600 text-sm mt-3 block">
            Please type the wallet name to confirm deletion, or click &quot;Cancel&quot; to keep your wallet.
          </Text>
        </div>
      </Modal>
    </>
  );
}