import { Button, Image, Platform, StyleSheet } from 'react-native';
//import { useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { NavigationProp, ParamListBase, useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { CameraViewProps } from '@/components/CameraView';
import { ProductDTO } from '@/dtos/ProductDTO';
import { useNavigation } from 'expo-router';

export default function TabTwoScreen() {
    const [isActive, setActive] = useState<boolean>(true);
    const [product, setJson] = useState<ProductDTO>({name: "null", kcal: -1});

    let CameraView: React.FC<CameraViewProps>;
    if (Platform.OS !== 'web') {
        CameraView = require('@/components/CameraView').CameraView;
    } else {
        CameraView = require('@/components/MockedCameraView').MockedCameraView;
    }

    const navigation: NavigationProp<ParamListBase> = useNavigation();

    useFocusEffect(
        React.useCallback(() => {
            console.log("focused")
            setActive(true)

            return () => {
                console.log("unfocused")
                setActive(false)
            };
        }, [])
    );
    const confirmInsert = () => {
        navigation.navigate("index",  {
            product: product
          })
    }
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <Image
                    source={require('@/assets/images/partial-react-logo.png')}
                    style={styles.reactLogo}
                />
            }>
            <ThemedView>
                <CameraView isActive={isActive} setJson={setJson} setActivate={setActive} />
                <ThemedText>{product.name}</ThemedText>
                <ThemedText>{product.kcal}</ThemedText>
                <Button
                    onPress={confirmInsert}
                    title="Confirm"
                    color="#841584"
                />
            </ThemedView>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
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