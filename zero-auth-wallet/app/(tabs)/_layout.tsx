import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import { History, LayoutDashboard, ScanLine, Settings, WalletCards } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1b26', // Tokyo Night Background
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          height: 70,
          borderRadius: 35,
          paddingBottom: 0,
          paddingTop: 0,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        },
        tabBarActiveTintColor: '#7aa2f7', // Primary
        tabBarInactiveTintColor: '#565f89', // Muted
        tabBarShowLabel: true,
        tabBarItemStyle: {
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <History size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center -mt-10">
              <View className={`w-16 h-16 rounded-full items-center justify-center border-4 border-[#1a1b26] ${focused ? 'bg-primary shadow-lg shadow-primary/50' : 'bg-[#16161e]'}`}>
                <ScanLine size={28} color={focused ? '#1a1b26' : '#7aa2f7'} />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="credentials"
        options={{
          title: 'Credentials',
          tabBarIcon: ({ color }) => <WalletCards size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
