'use client';

import { useState } from 'react';
import { Button, Popover, Input, Row, Col } from 'antd';
import { BgColorsOutlined } from '@ant-design/icons';

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  disabled?: boolean;
}

export default function ColorPicker({ 
  value = '#3B82F6', 
  onChange, 
  disabled = false 
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  // Predefined color palette
  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#1F2937', // Dark Gray
    '#7C3AED', // Violet
  ];

  const handleColorSelect = (color: string) => {
    onChange?.(color);
    setCustomColor(color);
    setOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    
    // Validate hex color format
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      onChange?.(color);
    }
  };

  const colorPicker = (
    <div className="w-64 p-4">
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Predefined Colors</h4>
        <Row gutter={[8, 8]}>
          {predefinedColors.map((color) => (
            <Col span={4} key={color}>
              <div
                className={`w-8 h-8 rounded cursor-pointer border-2 transition-all hover:scale-110 ${
                  value === color ? 'border-gray-800 shadow-lg' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                title={color}
              />
            </Col>
          ))}
        </Row>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Custom Color</h4>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={customColor}
            onChange={handleCustomColorChange}
            placeholder="#3B82F6"
            maxLength={7}
            className="font-mono text-sm"
          />
          <div
            className="w-8 h-8 rounded border border-gray-200 flex-shrink-0"
            style={{ backgroundColor: customColor }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter a hex color code (e.g., #3B82F6)
        </p>
      </div>
    </div>
  );

  return (
    <Popover
      content={colorPicker}
      title="Choose wallet color"
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
    >
      <Button
        disabled={disabled}
        className="flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors h-12 w-20"
        title="Click to choose wallet color"
      >
        <div className="flex flex-col items-center">
          <div
            className="w-6 h-4 rounded border border-gray-200 mb-1"
            style={{ backgroundColor: value }}
          />
          <BgColorsOutlined className="text-xs text-gray-500" />
        </div>
      </Button>
    </Popover>
  );
}