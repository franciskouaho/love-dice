import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Restaurant } from '../types/restaurant';

// Import conditionnel pour react-native-maps
let MapView: any = null;
let Marker: any = null;
let Region: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Region = maps.Region;
} catch (error) {
  console.log('react-native-maps not available in Expo Go');
}

// Types pour TypeScript
type MapViewType = typeof MapView;
type MarkerType = typeof Marker;
type RegionType = typeof Region;

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
  const mapRef = useRef<MapViewType>(null);
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
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=AIzaSyCRZPqnSHTVf2MuHvUCuwdcUXo3Zpm0CLI`;
      
      const response = await fetch(url);
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
        console.error('Erreur lors du chargement des coordonnées:', err);
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
    if (coordinates && mapRef.current && MapView) {
      const region: RegionType = {
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

  // Si MapView n'est pas disponible (Expo Go), afficher un placeholder
  if (!MapView) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>🗺️ Carte temporairement indisponible</Text>
          <Text style={styles.placeholderSubtext}>
            {restaurant.address}
          </Text>
          <Text style={styles.placeholderNote}>
            Disponible dans le build complet
          </Text>
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
          // Map ready
        }}
        onError={(error) => {
          console.error('Map error:', error);
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtext: {
    color: '#F4C869',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 8,
  },
  placeholderNote: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
    fontStyle: 'italic',
  },
});
