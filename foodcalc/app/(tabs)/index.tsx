import { Image, StyleSheet, Platform, FlatList, SafeAreaView, StatusBar } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProductDTO } from '@/dtos/ProductDTO';

export default function HomeScreen() {

  type RootStackParamList = {
    index: { product: ProductDTO };
  };

  const [productList, setProductList] = useState<Set<ProductDTO>>(new Set<ProductDTO>())
  const route = useRoute<RouteProp<RootStackParamList, 'index'>>();
  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.product) {
        setProductList(prev => new Set([...prev, route.params.product]));
      }

      return () => {
       
      };
    }, [route?.params?.product])
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <FlatList data={[...productList]} renderItem={({ item }) => <ThemedText>{item.name} - {item.kcal}</ThemedText>} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
