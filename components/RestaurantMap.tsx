import { useEffect, useRef, useState } from 'react';
import { Dimensions, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Restaurant } from '../types/restaurant';

// Import conditionnel de react-native-maps
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (error) {
  console.log('react-native-maps not available in Expo Go');
}

// Composant MapView personnalisé qui gère les erreurs
const SafeMapView = ({ children, ...props }: any) => {
  if (!MapView) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '500' }}>
          📍 Maps non disponibles en mode développement
        </Text>
      </View>
    );
  }
  
  return <MapView {...props}>{children}</MapView>;
};

interface RestaurantMapProps {
  restaurant: Restaurant;
  height?: number;
}

const { width } = Dimensions.get('window');

interface Coordinates {
  latitude: number;
  longitude: number;
}

export function RestaurantMap({ restaurant, height = 200 }: RestaurantMapProps) {
  const mapRef = useRef<MapView>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Coordonnées par défaut (Paris) si pas de coordonnées GPS
  const defaultLatitude = 48.8566;
  const defaultLongitude = 2.3522;

  // Fonction de géocodage pour convertir une adresse en coordonnées
  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    try {
      // Utiliser l'API de géocodage de Google Maps
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=AIzaSyAXrDxGHxOgHcFxRfHEL2Qi82KpE29CJMY`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      }
      
      return null;
    } catch (err) {
      console.error('Erreur géocodage:', err);
      return null;
    }
  };

  useEffect(() => {
    const loadCoordinates = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Si on a déjà des coordonnées GPS, les utiliser
        if (restaurant.latitude && restaurant.longitude) {
          setCoordinates({
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          });
          setLoading(false);
          return;
        }
        
        // Sinon, faire du géocodage avec l'adresse
        if (restaurant.address && restaurant.address !== 'N/A') {
          const coords = await geocodeAddress(restaurant.address);
          if (coords) {
            setCoordinates(coords);
          } else {
            setError('Impossible de localiser le restaurant');
            setCoordinates({
              latitude: defaultLatitude,
              longitude: defaultLongitude,
            });
          }
        } else {
          setError('Adresse non disponible');
          setCoordinates({
            latitude: defaultLatitude,
            longitude: defaultLongitude,
          });
        }
      } catch (err) {
        setError('Erreur de géolocalisation');
        setCoordinates({
          latitude: defaultLatitude,
          longitude: defaultLongitude,
        });
      } finally {
        setLoading(false);
      }
    };

    loadCoordinates();
  }, [restaurant.id, restaurant.address, restaurant.latitude, restaurant.longitude]);

  // Centrer la carte sur le restaurant quand les coordonnées sont chargées
  useEffect(() => {
    if (coordinates && mapRef.current) {
      const region: Region = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [coordinates]);

  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>📍 Localisation en cours...</Text>
        </View>
      </View>
    );
  }

  if (!coordinates) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Impossible de localiser le restaurant</Text>
        </View>
      </View>
    );
  }

  // Toujours essayer d'afficher la map, même si react-native-maps n'est pas disponible
  // Si MapView n'est pas disponible, on affichera une erreur dans le composant MapView lui-même

  return (
    <View style={[styles.container, { height }]}>
      <SafeMapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
        loadingEnabled={true}
        loadingIndicatorColor="#E0115F"
        loadingBackgroundColor="rgba(255, 255, 255, 0.1)"
      >
        {Marker && (
          <Marker
            coordinate={{
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            }}
            title={restaurant.name}
            description={restaurant.address}
            pinColor="#E0115F"
          />
        )}
      </SafeMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackAddress: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  fallbackButton: {
    backgroundColor: 'rgba(224, 17, 95, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  fallbackButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
