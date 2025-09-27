'use client';

import { useState } from 'react';
import { Modal, Form, Input, InputNumber, Radio, Button, message } from 'antd';
import { PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createWalletEntry } from '../store/slices/walletSlice';
import { RootState } from '../store';
import TagSelector from './TagSelector';
import apiClient from '../lib/api-client';

const { TextArea } = Input;

interface AddEntryModalProps {
  open: boolean;
  onClose: () => void;
  walletId: string;
  walletName: string;
}

function AddEntryModal({ open, onClose, walletId, walletName }: AddEntryModalProps) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state: RootState) => state.wallet);

  const handleSubmit = async (values: { amount: number; type: 'add' | 'subtract'; description?: string; tags?: string[] }) => {
    try {
      const result = await dispatch(createWalletEntry({ 
        walletId, 
        entryData: values 
      }));
      
      if (createWalletEntry.fulfilled.match(result)) {
        message.success(`Entry ${values.type === 'add' ? 'added to' : 'subtracted from'} wallet successfully!`);
        // Clear relevant cache to ensure fresh data
        apiClient.clearCache('/api/wallets');
        apiClient.clearCache(`/api/wallets/${walletId}`);
        form.resetFields();
        onClose();
      } else {
        message.error(result.payload || 'Failed to add entry');
      }
    } catch {
      message.error('An error occurred while adding the entry');
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const entryType = Form.useWatch('type', form);

  return (
    <Modal
      title={`Add Entry to ${walletName}`}
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
        initialValues={{ type: 'add' }}
      >
        <Form.Item
          name="type"
          label="Transaction Type"
          rules={[{ required: true, message: 'Please select a transaction type!' }]}
        >
          <Radio.Group size="large">
            <Radio.Button value="add" className="flex-1">
              <ArrowUpOutlined className="text-green-600" />
              <span className="ml-2">Add Money (Credit)</span>
            </Radio.Button>
            <Radio.Button value="subtract" className="flex-1">
              <ArrowDownOutlined className="text-red-600" />
              <span className="ml-2">Subtract Money (Debit)</span>
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount"
          rules={[
            { required: true, message: 'Please enter an amount!' },
            { type: 'number', min: 0.01, message: 'Amount must be greater than 0!' },
          ]}
        >
          <InputNumber<number>
            style={{ width: '100%' }}
            placeholder="Enter amount"
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, '') || '0')}
            precision={2}
            step={0.01}
            min={0.01}
            max={999999.99}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description (Optional)"
          rules={[
            { max: 500, message: 'Description cannot exceed 500 characters!' },
          ]}
        >
          <TextArea
            placeholder={`Enter description for this ${entryType === 'add' ? 'credit' : 'debit'} transaction...`}
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="tags"
          label="Tags (Optional)"
          rules={[
            { type: 'array', max: 5, message: 'Maximum 5 tags allowed!' },
          ]}
        >
          <TagSelector
            placeholder="Select up to 5 tags to categorize this transaction"
            maxTags={5}
          />
        </Form.Item>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button onClick={handleClose} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            icon={<PlusOutlined />}
            size="large"
            className={entryType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {entryType === 'add' ? 'Add Entry' : 'Subtract Entry'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

interface AddEntryButtonProps {
  walletId: string;
  walletName: string;
  className?: string;
  variant?: 'button' | 'primary';
  size?: 'small' | 'middle' | 'large';
}

export default function AddEntryButton({ 
  walletId, 
  walletName, 
  className = '', 
  variant = 'primary',
  size = 'large'
}: AddEntryButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        type={variant === 'primary' ? 'primary' : 'default'}
        icon={<PlusOutlined />}
        onClick={() => setModalOpen(true)}
        size={size}
        className={className}
      >
        Add Entry
      </Button>
      
      <AddEntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        walletId={walletId}
        walletName={walletName}
      />
    </>
  );
}