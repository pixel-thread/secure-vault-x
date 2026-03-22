import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '../lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string; // Standardize to className
  isSafe?: boolean;
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  className,
  isSafe = true 
}) => {
  const Component = isSafe ? SafeAreaView : View;

  return (
    <Component className={cn('flex-1 bg-background', className)}>
      {children}
    </Component>
  );
};
