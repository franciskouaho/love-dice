import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Restaurant } from '../types/restaurant';

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
      console.log('🗺️ Tentative de géocodage pour:', address);
      // Utiliser l'API de géocodage de Google Maps
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=AIzaSyCRZPqnSHTVf2MuHvUCuwdcUXo3Zpm0CLI`;
      console.log('🔗 URL API:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📍 Réponse géocodage:', data);
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('✅ Coordonnées trouvées:', location);
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      } else {
        console.warn('⚠️ Géocodage échoué:', data.status, data.error_message);
      }
      
      return null;
    } catch (err) {
      console.error('❌ Erreur géocodage:', err);
      return null;
    }
  };

  useEffect(() => {
    const loadCoordinates = async () => {
      console.log('🗺️ Chargement coordonnées pour restaurant:', restaurant.name);
      setLoading(true);
      setError(null);
      
      try {
        // Si on a déjà des coordonnées GPS, les utiliser
        if (restaurant.latitude && restaurant.longitude) {
          console.log('📍 Utilisation coordonnées GPS existantes:', restaurant.latitude, restaurant.longitude);
          setCoordinates({
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          });
          setLoading(false);
          return;
        }
        
        // Sinon, faire du géocodage avec l'adresse
        if (restaurant.address && restaurant.address !== 'N/A') {
          console.log('🔍 Géocodage nécessaire pour adresse:', restaurant.address);
          const coords = await geocodeAddress(restaurant.address);
          if (coords) {
            console.log('✅ Coordonnées obtenues:', coords);
            setCoordinates(coords);
          } else {
            console.warn('⚠️ Géocodage échoué, utilisation coordonnées par défaut');
            setError('Impossible de localiser le restaurant');
            setCoordinates({
              latitude: defaultLatitude,
              longitude: defaultLongitude,
            });
          }
        } else {
          console.warn('⚠️ Pas d\'adresse disponible, utilisation coordonnées par défaut');
          setError('Adresse non disponible');
          setCoordinates({
            latitude: defaultLatitude,
            longitude: defaultLongitude,
          });
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement des coordonnées:', err);
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

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        mapType="standard"
        loadingEnabled={true}
        loadingIndicatorColor="#E0115F"
        loadingBackgroundColor="rgba(255, 255, 255, 0.1)"
        onMapReady={() => {
          console.log('🗺️ Map ready!');
        }}
        onError={(error) => {
          console.error('🗺️ Map error:', error);
        }}
      >
        <Marker
          coordinate={{
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          }}
          title={restaurant.name}
          description={restaurant.address}
          pinColor="#E0115F"
        />
      </MapView>
      
      {/* Affichage des coordonnées pour debug */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            📍 {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
          </Text>
          {error && <Text style={styles.debugError}>{error}</Text>}
        </View>
      )}
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
  debugInfo: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  debugError: {
    color: '#FF6B6B',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
});
