'use client';

import CachedEmojiPicker from './CachedEmojiPicker';

interface MoneyIconPickerProps {
  value?: string;
  onChange?: (icon: string) => void;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
}

export default function MoneyIconPicker({ 
  value = '💰', 
  onChange, 
  size = 'large',
  disabled = false 
}: MoneyIconPickerProps) {
  return (
    <CachedEmojiPicker
      value={value}
      onChange={onChange}
      size={size}
      disabled={disabled}
      placeholder="Choose wallet icon"
    />
  );
}