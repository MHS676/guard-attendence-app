import * as Location from 'expo-location';

export async function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
  // 1. Request location permissions
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access location was denied. Please enable location services.');
  }

  // 2. Fetch current GPS position
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}