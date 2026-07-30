import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  return <View style={styles.page}><Card><Card.Content style={styles.center}><Avatar.Text size={72} label={user?.name.split(' ').map((word) => word[0]).join('').slice(0, 2) || 'U'} /><Text variant="titleLarge">{user?.name}</Text><Text variant="bodyMedium">{user?.email}</Text><Text variant="bodyMedium">{user?.role}</Text></Card.Content></Card><Button mode="outlined" textColor="#B42318" onPress={() => void signOut()}>Sign out</Button></View>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: 20, gap: 20, backgroundColor: '#F7F9FC' }, center: { alignItems: 'center', gap: 10, paddingVertical: 20 } });
