'use client';

import { useState } from 'react';
import { 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Typography, 
  Alert, 
  Divider 
} from 'antd';
import { ShareAltOutlined, UserAddOutlined } from '@ant-design/icons';


const { Option } = Select;

interface ShareWalletButtonProps {
  walletId: string;
  walletName: string;
  size?: 'small' | 'middle' | 'large';
}

interface ShareWalletForm {
  email: string;
  role: 'viewer' | 'partner';
}

export default function ShareWalletButton({ walletId, walletName, size = 'middle' }: ShareWalletButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm<ShareWalletForm>();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async (values: ShareWalletForm) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/wallets/${walletId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.isSuccess) {
        message.success('Wallet invitation sent successfully! The user will be notified.');
        handleCancel();
      } else {
        message.error(result.error || 'Failed to send wallet invitation');
      }
    } catch (error) {
      console.error('Error sharing wallet:', error);
      message.error('An error occurred while sharing the wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        type="default"
        icon={<ShareAltOutlined />}
        size={size}
        onClick={showModal}
        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
      >
        Share Wallet
      </Button>

      <Modal
        title={
          <div className="flex items-center space-x-2">
            <UserAddOutlined className="text-green-600" />
            <span>Share &ldquo;{walletName}&rdquo; Wallet</span>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={500}
      >
        <Alert
          message="Wallet Invitation System"
          description={
            <div className="space-y-2 text-sm">
              <div><strong>How it works:</strong> The user will receive an invitation notification that they can accept or decline</div>
              <div><strong>Viewer:</strong> Can only view wallet transactions (cannot add entries)</div>
              <div><strong>Partner:</strong> Can view and add transactions (cannot delete or share wallet)</div>
            </div>
          }
          type="info"
          showIcon
          className="mb-4"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter the user\'s email address' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input 
              placeholder="Enter the email address of the user you want to share with"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Access Level"
            name="role"
            rules={[{ required: true, message: 'Please select an access level' }]}
            initialValue="viewer"
          >
            <Select size="large" placeholder="Select access level">
              <Option value="viewer">
                <div>
                  <div className="font-medium">Viewer</div>
                  <div className="text-gray-500 text-xs">Can only view wallet and transactions</div>
                </div>
              </Option>
              <Option value="partner">
                <div>
                  <div className="font-medium">Partner</div>
                  <div className="text-gray-500 text-xs">Can view and add transactions</div>
                </div>
              </Option>
            </Select>
          </Form.Item>

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              icon={<ShareAltOutlined />}
            >
              Send Invitation
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}