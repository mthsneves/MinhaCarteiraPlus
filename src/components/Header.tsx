import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
}

export function Header({ title, showBackButton = true }: HeaderProps) {
  return (
    <View className="flex-row items-center mb-6 pt-4">
      {showBackButton && (
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="mr-3 p-1"
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color="#22D8F0" />
        </TouchableOpacity>
      )}
      <Text className="font-['Space_Grotesk'] text-[27px] font-bold text-text-1">
        {title}
      </Text>
    </View>
  );
}
