import React, { useState, useEffect, memo } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Button, Popover } from 'antd';

interface CachedEmojiPickerProps {
  value?: string;
  onChange?: (emoji: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
  trigger?: 'click' | 'hover';
}

// Emoji picker cache
class EmojiPickerCache {
  private static instance: EmojiPickerCache;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  static getInstance(): EmojiPickerCache {
    if (!EmojiPickerCache.instance) {
      EmojiPickerCache.instance = new EmojiPickerCache();
    }
    return EmojiPickerCache.instance;
  }

  async preloadEmojis(): Promise<void> {
    if (this.isLoaded) return;
    
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve) => {
      // Create a hidden emoji picker to preload emojis
      const hiddenContainer = document.createElement('div');
      hiddenContainer.style.position = 'absolute';
      hiddenContainer.style.top = '-9999px';
      hiddenContainer.style.left = '-9999px';
      hiddenContainer.style.visibility = 'hidden';
      document.body.appendChild(hiddenContainer);

      // Import emoji data to cache it
      import('emoji-picker-react').then(() => {
        this.isLoaded = true;
        document.body.removeChild(hiddenContainer);
        resolve();
      });
    });

    return this.loadPromise;
  }

  isReady(): boolean {
    return this.isLoaded;
  }
}

const CachedEmojiPicker: React.FC<CachedEmojiPickerProps> = memo(({
  value = '😀',
  onChange,
  placeholder = 'Select emoji',
  disabled = false,
  size = 'middle',
  trigger = 'click'
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const emojiCache = EmojiPickerCache.getInstance();

  useEffect(() => {
    // Start preloading emojis when component mounts
    if (!emojiCache.isReady()) {
      setIsLoading(true);
      emojiCache.preloadEmojis().then(() => {
        setIsReady(true);
        setIsLoading(false);
      });
    } else {
      setIsReady(true);
    }
  }, [emojiCache]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange?.(emojiData.emoji);
    setIsPickerOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsPickerOpen(open);
    
    // Preload emojis when user tries to open picker for first time
    if (open && !emojiCache.isReady() && !isLoading) {
      setIsLoading(true);
      emojiCache.preloadEmojis().then(() => {
        setIsReady(true);
        setIsLoading(false);
      });
    }
  };

  const emojiPickerContent = (
    <div style={{ maxHeight: '350px', overflow: 'hidden' }}>
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="text-center">
            <div className="animate-spin text-2xl mb-2">🎠</div>
            <div className="text-sm text-gray-500">Loading emojis...</div>
          </div>
        </div>
      ) : isReady ? (
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={Theme.AUTO}
          searchPlaceHolder="Search emojis..."
          previewConfig={{
            showPreview: false
          }}
          width={320}
          height={350}
          lazyLoadEmojis={true}
        />
      ) : (
        <div className="flex justify-center items-center p-8">
          <div className="text-center">
            <div className="text-2xl mb-2">📱</div>
            <div className="text-sm text-gray-500">Preparing emoji picker...</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={emojiPickerContent}
      title="Choose an Emoji"
      trigger={trigger}
      open={isPickerOpen}
      onOpenChange={handleOpenChange}
      placement="bottomLeft"
      overlayStyle={{ 
        padding: 0,
        zIndex: 1050 
      }}
      overlayInnerStyle={{ 
        padding: 0,
        borderRadius: '8px'
      }}
    >
      <Button
        size={size}
        disabled={disabled}
        className="flex items-center justify-center min-w-[60px]"
        style={{
          padding: size === 'large' ? '8px 12px' : size === 'small' ? '4px 8px' : '6px 10px',
        }}
      >
        <span 
          className={`${
            size === 'large' ? 'text-2xl' : 
            size === 'small' ? 'text-sm' : 'text-lg'
          }`}
        >
          {value || '😀'}
        </span>
      </Button>
    </Popover>
  );
});

CachedEmojiPicker.displayName = 'CachedEmojiPicker';

export default CachedEmojiPicker;

// Export the cache instance for manual control if needed
export const emojiPickerCache = EmojiPickerCache.getInstance();