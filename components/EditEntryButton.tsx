'use client';

import { useState } from 'react';
import { Button, Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../store/hooks';
import { updateWalletEntry } from '../store/slices/walletSlice';
import { WalletEntry } from '../store/slices/walletSlice';
import TagSelector from './TagSelector';
import toast from 'react-hot-toast';

const { Option } = Select;
const { TextArea } = Input;

interface EditEntryButtonProps {
  entry: WalletEntry;
  walletId: string;
  userRole?: 'owner' | 'viewer' | 'partner';
  onSuccess?: () => void;
}

export default function EditEntryButton({ 
  entry, 
  walletId, 
  userRole = 'owner',
  onSuccess 
}: EditEntryButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();

  // Check if user can edit (only owners and partners)
  const canEdit = userRole === 'owner' || userRole === 'partner';

  const showModal = () => {
    setIsModalVisible(true);
    // Pre-fill form with existing entry data
    form.setFieldsValue({
      amount: entry.amount,
      type: entry.type,
      description: entry.description || '',
      tags: entry.tags?.map(tag => tag._id) || [],
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      
      const entryData = {
        amount: values.amount,
        type: values.type,
        description: values.description?.trim() || '',
        tags: values.tags || [],
      };

      const resultAction = await dispatch(updateWalletEntry({
        walletId,
        entryId: entry._id,
        entryData,
      }));

      if (updateWalletEntry.fulfilled.match(resultAction)) {
        toast.success('Entry updated successfully!');
        setIsModalVisible(false);
        form.resetFields();
        onSuccess?.();
      } else {
        const error = resultAction.payload as string;
        toast.error(error || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render button if user can't edit
  if (!canEdit) {
    return null;
  }

  return (
    <>
      <Button
        icon={<EditOutlined />}
        size="small"
        type="link"
        onClick={showModal}
        title="Edit Entry"
        className="text-blue-600 hover:text-blue-800"
      />

      <Modal
        title="Edit Entry"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            label="Transaction Type"
            name="type"
            rules={[{ required: true, message: 'Please select transaction type' }]}
          >
            <Select
              size="large"
              placeholder="Select type"
            >
              <Option value="add">
                <span className="text-green-600">+ Credit (Add Money)</span>
              </Option>
              <Option value="subtract">
                <span className="text-red-600">- Debit (Subtract Money)</span>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Amount"
            name="amount"
            rules={[
              { required: true, message: 'Please enter amount' },
              { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
            ]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="Enter amount"
              min={0.01}
              step={0.01}
              precision={2}
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
            />
          </Form.Item>

          <Form.Item
            label="Description (Optional)"
            name="description"
            rules={[
              { max: 500, message: 'Description cannot exceed 500 characters' },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Enter description (optional)"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="Tags (Optional)"
            name="tags"
            rules={[
              { type: 'array', max: 5, message: 'Maximum 5 tags allowed' },
            ]}
          >
            <TagSelector
              placeholder="Select up to 5 tags to categorize this transaction"
              maxTags={5}
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
            >
              Update Entry
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}