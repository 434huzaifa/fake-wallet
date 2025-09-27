'use client';

import CachedEmojiPicker from './CachedEmojiPicker';

interface EmojiAvatarPickerProps {
  value?: string;
  onChange?: (emoji: string) => void;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
}

export default function EmojiAvatarPicker({ 
  value = '😀', 
  onChange, 
  size = 'large',
  disabled = false 
}: EmojiAvatarPickerProps) {
  return (
    <CachedEmojiPicker
      value={value}
      onChange={onChange}
      size={size}
      disabled={disabled}
      placeholder="Choose your avatar"
    />
  );
}