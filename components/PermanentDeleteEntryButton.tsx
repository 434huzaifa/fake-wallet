'use client';

import { useState } from 'react';
import { Button, Modal, Typography, Space } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../store/hooks';
import { permanentDeleteWalletEntry } from '../store/slices/walletSlice';
import { WalletEntry } from '../store/slices/walletSlice';
import toast from 'react-hot-toast';

const { Text, Paragraph } = Typography;

interface PermanentDeleteEntryButtonProps {
  entry: WalletEntry;
  walletId: string;
  userRole?: 'owner' | 'viewer' | 'partner';
  onSuccess?: () => void;
}

export default function PermanentDeleteEntryButton({ 
  entry, 
  walletId, 
  userRole = 'owner',
  onSuccess 
}: PermanentDeleteEntryButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  // Check if user can permanently delete (only owners and partners)
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
      
      const resultAction = await dispatch(permanentDeleteWalletEntry({
        walletId,
        entryId: entry._id,
      }));

      if (permanentDeleteWalletEntry.fulfilled.match(resultAction)) {
        toast.success('Entry permanently deleted!');
        setIsModalVisible(false);
        onSuccess?.();
      } else {
        const error = resultAction.payload as string;
        toast.error(error || 'Failed to permanently delete entry');
      }
    } catch (error) {
      console.error('Error permanently deleting entry:', error);
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
        title="Permanently Delete Entry"
        className="text-red-700 hover:text-red-900"
      >
        Delete Forever
      </Button>

      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined className="text-red-500" />
            Permanently Delete Entry
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
            Delete Forever
          </Button>,
        ]}
        width={480}
      >
        <div className="py-4">
          <Paragraph className="text-red-600 mb-4 font-medium">
            ⚠️ This action cannot be undone!
          </Paragraph>
          
          <Paragraph className="text-gray-700 mb-4">
            You are about to permanently delete this entry. This will:
          </Paragraph>
          
          <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
            <li>Completely remove this entry from the database</li>
            <li>Make this entry unrecoverable</li>
            <li>Remove it from the deleted items list</li>
          </ul>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex justify-between items-center mb-2">
              <Text strong className="text-red-800">Entry to be deleted:</Text>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <Text className="text-red-700">Type:</Text>
                <Text className={entry.type === 'add' ? 'text-green-600' : 'text-red-600'}>
                  {entry.type === 'add' ? 'Credit' : 'Debit'}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-red-700">Amount:</Text>
                <Text strong className={entry.type === 'add' ? 'text-green-600' : 'text-red-600'}>
                  {entry.type === 'add' ? '+' : '-'}{formatCurrency(entry.amount)}
                </Text>
              </div>
              {entry.description && (
                <div className="flex justify-between">
                  <Text className="text-red-700">Description:</Text>
                  <Text className="text-right max-w-xs truncate">{entry.description}</Text>
                </div>
              )}
              {entry.deletedAt && (
                <div className="flex justify-between">
                  <Text className="text-red-700">Deleted:</Text>
                  <Text className="text-red-600">
                    {new Date(entry.deletedAt).toLocaleDateString()}
                  </Text>
                </div>
              )}
            </div>
          </div>

          <Paragraph className="text-sm text-red-600 mt-4 mb-0 font-medium">
            <strong>Warning:</strong> Once deleted, this entry cannot be recovered. Please confirm that you want to proceed.
          </Paragraph>
        </div>
      </Modal>
    </>
  );
}