'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space, 
  Modal, 
  Alert,
  message 
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logoutUser } from '../../../store/slices/authSlice';
import EmojiAvatarPicker from '../../../components/EmojiAvatarPicker';

const { Title, Text } = Typography;
const { confirm } = Modal;

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return null;
  }

  const handleSaveProfile = async (values: { name: string; avatar: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.isSuccess) {
        message.success('Profile updated successfully!');
        setIsEditing(false);
        // TODO: Update user in Redux store
        window.location.reload(); // Temporary solution
      } else {
        message.error(data.error || 'Failed to update profile');
      }
    } catch {
      message.error('An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = () => {
    confirm({
      title: 'Delete Account',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete your account?</p>
          <Alert
            message="Warning"
            description="This action cannot be undone. All your wallets and transaction data will be permanently deleted."
            type="warning"
            showIcon
            className="mt-3"
          />
        </div>
      ),
      okText: 'Yes, Delete My Account',
      okType: 'danger',
      cancelText: 'Cancel',
      async onOk() {
        try {
          const response = await fetch('/api/auth/profile', {
            method: 'DELETE',
          });

          const data = await response.json();

          if (data.isSuccess) {
            message.success('Account deleted successfully');
            await dispatch(logoutUser());
            router.push('/');
          } else {
            message.error(data.error || 'Failed to delete account');
          }
        } catch {
          message.error('An error occurred while deleting account');
        }
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="text-6xl">{user.avatar || '😀'}</div>
        <div>
          <Title level={2} className="!mb-1">
            Profile Settings
          </Title>
          <Text className="text-gray-500">
            Manage your account information and preferences
          </Text>
        </div>
      </div>

      {/* Profile Information */}
      <Card title="Profile Information" className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: user.name,
            email: user.email,
            avatar: user.avatar || '😀',
          }}
          onFinish={handleSaveProfile}
        //   disabled={!isEditing}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              name="avatar"
              label="Avatar"
              rules={[
                { max: 4, message: 'Avatar must be a single emoji!' },
              ]}
            >
              <EmojiAvatarPicker disabled={!isEditing} />
            </Form.Item>

            <div />

            <Form.Item
              name="name"
              label="Full Name"
              rules={[
                { required: true, message: 'Please input your name!' },
                { min: 2, message: 'Name must be at least 2 characters!' },
                { max: 100, message: 'Name cannot exceed 100 characters!' },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Enter your full name"
                disabled={!isEditing}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email Address"
            >
              <Input
                disabled
                value={user.email}
                className="bg-gray-50"
                suffix={
                  <Text className="text-xs text-gray-400">
                    Cannot be changed
                  </Text>
                }
              />
            </Form.Item>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {isEditing && (
                <Space>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    icon={<SaveOutlined />}
                  >
                    Save Changes
                  </Button>
                </Space>
              )}
              {!isEditing && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Card>

      {/* Danger Zone */}
      <Card title="Danger Zone" className="shadow-sm">
        <Alert
          message="Delete Account"
          description="Once you delete your account, there is no going back. Please be certain."
          type="error"
          showIcon
          action={
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteProfile}
            >
              Delete Account
            </Button>
          }
        />
      </Card>
    </div>
  );
}