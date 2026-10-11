import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  // Find matching Lucide icon or default to Folder/Circle
  const IconComponent = (Icons as any)[name] || Icons.Folder;
  return <IconComponent className={className} size={size} />;
};
