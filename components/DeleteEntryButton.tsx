'use client';

import { useState } from 'react';
import { Button, Modal, Typography, Space } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../store/hooks';
import { deleteWalletEntry } from '../store/slices/walletSlice';
import { WalletEntry } from '../store/slices/walletSlice';
import toast from 'react-hot-toast';

const { Text, Paragraph } = Typography;

interface DeleteEntryButtonProps {
  entry: WalletEntry;
  walletId: string;
  userRole?: 'owner' | 'viewer' | 'partner';
  onSuccess?: () => void;
}

export default function DeleteEntryButton({ 
  entry, 
  walletId, 
  userRole = 'owner',
  onSuccess 
}: DeleteEntryButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  // Check if user can delete (only owners and partners)
  const canDelete = userRole === 'owner' || userRole === 'partner';

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      
      const resultAction = await dispatch(deleteWalletEntry({
        walletId,
        entryId: entry._id,
      }));

      if (deleteWalletEntry.fulfilled.match(resultAction)) {
        toast.success('Entry deleted successfully!');
        setIsModalVisible(false);
        onSuccess?.();
      } else {
        const error = resultAction.payload as string;
        toast.error(error || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Don't render button if user can't delete
  if (!canDelete) {
    return null;
  }

  return (
    <>
      <Button
        icon={<DeleteOutlined />}
        size="small"
        type="link"
        danger
        onClick={showModal}
        title="Delete Entry"
        className="text-red-600 hover:text-red-800"
      />

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined className="text-orange-500" />
            Delete Entry
          </Space>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={isLoading}
            onClick={handleDelete}
          >
            Delete Entry
          </Button>,
        ]}
        width={480}
      >
        <div className="py-4">
          <Paragraph className="text-gray-700 mb-4">
            Are you sure you want to delete this entry? This action will:
          </Paragraph>
          
          <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
            <li>Remove this entry from your active transactions</li>
            <li>Update your wallet balance accordingly</li>
            <li>Move the entry to deleted items (can be restored later)</li>
          </ul>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <Text strong>Entry Details:</Text>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Text className="text-gray-600">Type:</Text>
                <Text className={entry.type === 'add' ? 'text-green-600' : 'text-red-600'}>
                  {entry.type === 'add' ? 'Credit' : 'Debit'}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-gray-600">Amount:</Text>
                <Text strong className={entry.type === 'add' ? 'text-green-600' : 'text-red-600'}>
                  {entry.type === 'add' ? '+' : '-'}{formatCurrency(entry.amount)}
                </Text>
              </div>
              {entry.description && (
                <div className="flex justify-between">
                  <Text className="text-gray-600">Description:</Text>
                  <Text className="text-right max-w-xs truncate">{entry.description}</Text>
                </div>
              )}
            </div>
          </div>

          <Paragraph className="text-sm text-gray-500 mt-4 mb-0">
            <strong>Note:</strong> This is a soft delete. You can restore this entry later from the deleted items section.
          </Paragraph>
        </div>
      </Modal>
    </>
  );
}