'use client';

import { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createWallet } from '../store/slices/walletSlice';
import MoneyIconPicker from './MoneyIconPicker';
import ColorPicker from './ColorPicker';

interface CreateWalletModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateWalletModal({ open, onClose }: CreateWalletModalProps) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.wallet);

  const handleSubmit = async (values: { name: string; icon: string; backgroundColor: string }) => {
    try {
      const result = await dispatch(createWallet(values));
      if (createWallet.fulfilled.match(result)) {
        message.success('Wallet created successfully!');
        form.resetFields();
        onClose();
      } else {
        message.error(result.payload || 'Failed to create wallet');
      }
    } catch {
      message.error('An error occurred while creating the wallet');
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Create New Wallet"
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
        initialValues={{ icon: '💰', backgroundColor: '#3B82F6' }}
      >
        <Form.Item
          name="name"
          label="Wallet Name"
          rules={[
            { required: true, message: 'Please enter a wallet name!' },
            { min: 1, message: 'Wallet name cannot be empty!' },
            { max: 100, message: 'Wallet name cannot exceed 100 characters!' },
          ]}
        >
          <Input
            placeholder="Enter wallet name (e.g., Personal Wallet)"
            maxLength={100}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="icon"
          label="Wallet Icon"
          rules={[
            { required: true, message: 'Please select a wallet icon!' },
            { max: 4, message: 'Icon must be a single character or emoji!' },
          ]}
        >
          <MoneyIconPicker />
        </Form.Item>

        <Form.Item
          name="backgroundColor"
          label="Background Color"
          rules={[
            { required: true, message: 'Please select a background color!' },
            { pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, message: 'Please select a valid color!' },
          ]}
        >
          <ColorPicker />
        </Form.Item>

        <div className="flex justify-end space-x-2">
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            icon={<PlusOutlined />}
          >
            Create Wallet
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

interface CreateWalletButtonProps {
  className?: string;
}

export default function CreateWalletButton({ className = '' }: CreateWalletButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setModalOpen(true)}
        size="large"
        className={className}
      >
        Create New Wallet
      </Button>
      
      <CreateWalletModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}