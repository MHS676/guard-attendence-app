import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/DashboardScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();
export function AppTabs() {
  return <Tab.Navigator screenOptions={({ route }) => ({
    headerTitleAlign: 'center', tabBarActiveTintColor: '#135BEC',
    tabBarIcon: ({ color, size }) => <MaterialCommunityIcons color={color} size={size} name={route.name === 'Home' ? 'view-dashboard-outline' : route.name === 'History' ? 'calendar-clock-outline' : 'account-outline'} />,
  })}>
    <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Attendance' }} />
    <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>;
}
