import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
    Dimensions,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ImageSliderProps {
  images: string[];
  imageCount: number;
  restaurantName: string;
  height?: number;
}

const { width } = Dimensions.get('window');

export function ImageSlider({ images, imageCount, restaurantName, height = 200 }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Si pas d'images, afficher un placeholder
  if (!images || images.length === 0 || imageCount === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <LinearGradient
          colors={["#F4C869", "#E0115F"]}
          style={styles.placeholderGradient}
        >
          <View style={styles.placeholderContent}>
            <Ionicons name="restaurant" size={80} color="#FFFFFF" />
            <Text style={styles.placeholderText}>Aucune photo disponible</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const goToSlide = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * width,
        animated: true,
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      goToSlide(currentIndex + 1);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {images.map((imageUrl, index) => (
          <View key={index} style={styles.slide}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={() => {
                console.log(`Erreur chargement image ${index}:`, imageUrl);
              }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.imageOverlay}
            />
          </View>
        ))}
      </ScrollView>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <TouchableOpacity style={styles.navButtonLeft} onPress={goToPrevious}>
              <View style={styles.navButton}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}

          {currentIndex < images.length - 1 && (
            <TouchableOpacity style={styles.navButtonRight} onPress={goToNext}>
              <View style={styles.navButton}>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Pagination dots */}
      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
              onPress={() => goToSlide(index)}
            />
          ))}
        </View>
      )}

      {/* Image counter */}
      <View style={styles.imageCounter}>
        <View style={styles.imageCounterBackground}>
          <Text style={styles.imageCounterText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  placeholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  navButtonLeft: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  navButtonRight: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageCounterBackground: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});