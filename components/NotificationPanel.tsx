'use client';

import { useState, useEffect } from 'react';
import { 
  Badge, 
  Button, 
  Dropdown, 
  List, 
  Empty, 
  Card, 
  Tag, 
  Space, 
  message, 
  Spin,
  Avatar,
  Typography
} from 'antd';
import { 
  BellOutlined, 
  CheckOutlined, 
  CloseOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface WalletInvitation {
  _id: string;
  walletId: string;
  invitedUserId: string;
  invitedByUserId: string;
  role: 'viewer' | 'partner';
  status: 'pending' | 'accepted' | 'declined';
  invitedUserEmail: string;
  invitedUserName: string;
  invitedByUserName: string;
  walletName: string;
  walletIcon: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationPanel() {
  const [invitations, setInvitations] = useState<WalletInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invitations?status=pending');
      const result = await response.json();

      if (result.isSuccess) {
        setInvitations(result.data || []);
      } else {
        console.error('Failed to fetch invitations:', result.error);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    
    // Poll for new invitations every 10 seconds
    const interval = setInterval(fetchInvitations, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'decline') => {
    setRespondingTo(invitationId);
    
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (result.isSuccess) {
        message.success(result.message);
        // Remove the responded invitation from the list
        setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
        
        // Refresh the page to update wallet list if accepted
        if (action === 'accept') {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        message.error(result.error || `Failed to ${action} invitation`);
      }
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      message.error(`An error occurred while ${action}ing the invitation`);
    } finally {
      setRespondingTo(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const pendingCount = invitations.length;

  const dropdownContent = (
    <Card 
      className="w-96 max-h-96 overflow-auto" 
      bodyStyle={{ padding: '12px' }}
      title={
        <div className="flex items-center justify-between">
          <Title level={5} className="!mb-0">
            Wallet Invitations
          </Title>
          {pendingCount > 0 && (
            <Badge count={pendingCount} size="small" />
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="text-center py-4">
          <Spin />
          <Text className="block mt-2 text-gray-500">Loading invitations...</Text>
        </div>
      ) : invitations.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No pending invitations"
          className="py-4"
        />
      ) : (
        <List
          dataSource={invitations}
          size="small"
          renderItem={(invitation) => (
            <List.Item key={invitation._id} className="!px-0">
              <div className="w-full">
                <div className="flex items-start space-x-3">
                  <Avatar className="bg-blue-100 text-blue-600 flex-shrink-0 mt-1">
                    {invitation.walletIcon}
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Text strong className="text-sm truncate">
                        {invitation.walletName}
                      </Text>
                      <Tag 
                        icon={invitation.role === 'partner' ? <EditOutlined /> : <EyeOutlined />}
                        color={invitation.role === 'partner' ? 'green' : 'blue'}
                        className="text-xs"
                      >
                        {invitation.role}
                      </Tag>
                    </div>
                    
                    <Text className="text-xs text-gray-600 block mb-2">
                      {invitation.invitedByUserName} invited you • {formatTimeAgo(invitation.createdAt)}
                    </Text>
                    
                    <Space size="small">
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => handleInvitationResponse(invitation._id, 'accept')}
                        loading={respondingTo === invitation._id}
                        className="!text-xs !px-2"
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => handleInvitationResponse(invitation._id, 'decline')}
                        loading={respondingTo === invitation._id}
                        className="!text-xs !px-2"
                      >
                        Decline
                      </Button>
                    </Space>
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={['click']}
      open={isVisible}
      onOpenChange={setIsVisible}
      placement="bottomRight"
    >
      <Button
        type="text"
        icon={
          <Badge count={pendingCount} size="small">
            <BellOutlined className="text-gray-600 hover:text-blue-600" />
          </Badge>
        }
        className="flex items-center justify-center w-10 h-10"
      />
    </Dropdown>
  );
}