import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Home, Map as MapIcon, Scan as ScanIcon, List, Clipboard } from 'lucide-react-native';

import { HomeScreen } from '../../screens/HomeScreen/HomeScreen';
import { MapScreen } from '../../screens/MapScreen/MapScreen';
import { ScanScreen } from '../../screens/ScanScreen/ScanScreen';
import { InventoryScreen } from '../../screens/InventoryScreen/InventoryScreen';
import { ProfileScreen } from '../../screens/ProfileScreen/ProfileScreen';
import { TicketDashboardScreen } from '../../screens/TicketDashboardScreen/TicketDashboardScreen';
import { TicketDetailsScreen } from '../../screens/TicketDetailsScreen/TicketDetailsScreen';
import { LegalScreen } from '../../screens/LegalScreen/LegalScreen';
import { ItemFormScreen } from '../../screens/ItemFormScreen/ItemFormScreen';
import { RadarScreen } from '../../screens/RadarScreen/RadarScreen';
import { useThemeColors } from '../../theme/useThemeColors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom floating button for Scan
const CustomTabBarButton = ({ children, onPress, colors }: any) => (
  <TouchableOpacity
    style={{
      top: -20,
      justifyContent: 'center',
      alignItems: 'center',
    }}
    onPress={onPress}
  >
    <View style={{
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 10,
      borderWidth: 4,
      borderColor: colors.card,
    }}>
      {children}
    </View>
  </TouchableOpacity>
);

function TabNavigator() {
  const colors = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 90,
          paddingBottom: 24,
          paddingTop: 12,
          position: 'absolute', // To allow rounded corners to show background behind
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.05,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="ScanTab" 
        component={View} // Dummy component, handled by listener
        options={{
          tabBarIcon: () => <ScanIcon color="#FFFFFF" size={24} />,
          tabBarButton: (props) => <CustomTabBarButton {...props} colors={colors} />,
          tabBarLabel: () => null // Hide label for central button
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Scan'); // Navigate to the Stack screen!
          },
        })}
      />
      <Tab.Screen 
        name="Items" 
        component={InventoryScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <List color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Warehouse" 
        component={TicketDashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Clipboard color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Scan" component={ScanScreen} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="Radar" component={RadarScreen} options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="ItemForm" component={ItemFormScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="TicketDashboard" component={TicketDashboardScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="TicketDetails" component={TicketDetailsScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

