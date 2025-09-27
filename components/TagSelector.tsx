'use client';

import { useEffect } from 'react';
import { Select, Space, Typography } from 'antd';
import { TagOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTags, Tag } from '../store/slices/walletSlice';

const { Text } = Typography;
const { Option } = Select;

interface TagSelectorProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
}

export default function TagSelector({ 
  value = [], 
  onChange, 
  placeholder = "Select tags (max 5)",
  maxTags = 5,
  disabled = false
}: TagSelectorProps) {
  const dispatch = useAppDispatch();
  const { tags, isLoading } = useAppSelector((state) => state.wallet);

  useEffect(() => {
    // Fetch tags when component mounts if not already loaded
    if (tags.length === 0 && !isLoading) {
      dispatch(fetchTags());
    }
  }, [dispatch, tags.length, isLoading]);

  const handleChange = (selectedTags: string[]) => {
    // Ensure we don't exceed the maximum number of tags
    const limitedTags = selectedTags.slice(0, maxTags);
    onChange?.(limitedTags);
  };

  const renderTag = (tag: Tag) => (
    <Space key={tag._id} size={4}>
      <span>{tag.emoji}</span>
      <span>{tag.title}</span>
    </Space>
  );

  const renderSelectedTag = (props: any) => {
    const { label, closable, onClose } = props;
    const tag = tags.find(t => t.title === label);
    
    if (!tag) return label;

    return (
      <span
        className="ant-select-selection-item"
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px',
          backgroundColor: '#f0f0f0',
          padding: '2px 8px',
          borderRadius: '4px',
          margin: '2px'
        }}
      >
        <span>{tag.emoji}</span>
        <span>{tag.title}</span>
        {closable && (
          <span 
            className="ant-select-selection-item-remove"
            onClick={onClose}
            style={{ marginLeft: '4px', cursor: 'pointer' }}
          >
            ×
          </span>
        )}
      </span>
    );
  };

  return (
    <div>
      <Select
        mode="multiple"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        loading={isLoading}
        disabled={disabled}
        style={{ width: '100%' }}
        maxTagCount="responsive"
        size="large"
        suffixIcon={<TagOutlined />}
        optionLabelProp="label"
        tagRender={renderSelectedTag}
        maxTagPlaceholder={(values) => `+${values.length} more`}
      >
        {tags.map((tag) => (
          <Option 
            key={tag._id} 
            value={tag._id} 
            label={tag.title}
          >
            {renderTag(tag)}
          </Option>
        ))}
      </Select>
      
      {value.length > 0 && (
        <div className="mt-2">
          <Text type="secondary" className="text-xs">
            {value.length}/{maxTags} tags selected
          </Text>
        </div>
      )}
      
      {value.length >= maxTags && (
        <div className="mt-1">
          <Text type="warning" className="text-xs">
            Maximum {maxTags} tags allowed
          </Text>
        </div>
      )}
    </div>
  );
}