'use client';

import { useState } from 'react';
import { 
  Button, 
  Modal, 
  Table, 
  Tag, 
  Popconfirm, 
  message, 
  Typography, 
  Empty,

  Avatar
} from 'antd';
import { 
  TeamOutlined, 
  DeleteOutlined, 
  UserOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
// Using simple date formatting instead of date-fns to avoid additional dependency

const { Text } = Typography;

interface WalletAccessItem {
  _id: string;
  walletId: string;
  userId: string;
  role: 'viewer' | 'partner';
  grantedBy: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface ManageAccessButtonProps {
  walletId: string;
  walletName: string;
  size?: 'small' | 'middle' | 'large';
}

export default function ManageAccessButton({ walletId, walletName, size = 'middle' }: ManageAccessButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessList, setAccessList] = useState<WalletAccessItem[]>([]);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const showModal = () => {
    setIsModalVisible(true);
    fetchAccessList();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const fetchAccessList = async () => {
    setIsLoading(true);
    
    try {
      const result = await fetch(`/api/wallets/${walletId}/access`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json());

      if (result.isSuccess) {
        setAccessList(result.data || []);
      } else {
        message.error(result.error || 'Failed to fetch wallet access list');
      }
    } catch (error) {
      console.error('Error fetching access list:', error);
      message.error('An error occurred while fetching the access list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async (userId: string, userName: string) => {
    setIsRevoking(userId);
    
    try {
      const response = await fetch(`/api/wallets/${walletId}/access?userId=${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.isSuccess) {
        message.success(`Access revoked for ${userName}`);
        // Remove from local state
        setAccessList(prev => prev.filter(item => item.userId !== userId));
      } else {
        message.error(result.error || 'Failed to revoke access');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      message.error('An error occurred while revoking access');
    } finally {
      setIsRevoking(null);
    }
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: WalletAccessItem) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            icon={<UserOutlined />} 
            className="bg-blue-100 text-blue-600"
          />
          <div>
            <div className="font-medium text-gray-900">{record.userName}</div>
            <div className="text-sm text-gray-500">{record.userEmail}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: 'viewer' | 'partner') => (
        <Tag 
          icon={role === 'partner' ? <EditOutlined /> : <EyeOutlined />}
          color={role === 'partner' ? 'green' : 'blue'}
          className="capitalize"
        >
          {role}
        </Tag>
      ),
    },
    {
      title: 'Shared',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => {
        const date = new Date(createdAt);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        let timeAgo = '';
        if (diffInDays === 0) {
          timeAgo = 'Today';
        } else if (diffInDays === 1) {
          timeAgo = '1 day ago';
        } else if (diffInDays < 30) {
          timeAgo = `${diffInDays} days ago`;
        } else {
          timeAgo = date.toLocaleDateString();
        }
        
        return (
          <Text className="text-gray-500">
            {timeAgo}
          </Text>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: WalletAccessItem) => (
        <Popconfirm
          title="Revoke Access"
          description={`Are you sure you want to revoke ${record.userName}'s access to this wallet?`}
          onConfirm={() => handleRevokeAccess(record.userId, record.userName)}
          okText="Revoke"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            loading={isRevoking === record.userId}
            size="small"
          >
            Revoke
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Button
        type="default"
        icon={<TeamOutlined />}
        size={size}
        onClick={showModal}
        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
      >
        Manage Access
      </Button>

      <Modal
        title={
          <div className="flex items-center space-x-2">
            <TeamOutlined className="text-blue-600" />
            <span>Manage Access - &ldquo;{walletName}&rdquo;</span>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={
          <Button onClick={handleCancel}>
            Close
          </Button>
        }
        width={700}
      >
        {accessList.length === 0 && !isLoading ? (
          <Empty
            description="No users have been granted access to this wallet yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={accessList}
            rowKey="_id"
            loading={isLoading}
            pagination={false}
            size="small"
          />
        )}
      </Modal>
    </>
  );
}