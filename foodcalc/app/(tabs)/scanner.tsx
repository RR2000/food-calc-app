import { Image, StyleSheet } from 'react-native';
import { Camera, useCameraDevice, useCameraDevices, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { ThemedView } from '@/components/ThemedView';
import { ScreenContainer } from 'react-native-screens';
import ParallaxScrollView from '@/components/ParallaxScrollView';

export default function TabTwoScreen() {
    const [isActive, setActive] = useState<boolean>(true);
    const [testo, setJson] = useState<string>("");
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

    const getProduct = async (ean: string) => {
        try {
            const response = await fetch('http://localhost:8080/path?EAN=' + ean);
            const json: string = await response.text();
            console.log(json)
            setJson(json);
        } catch (error) {
            console.error(error);
        }
    };
    const requestPermissions = async () => {
        //console.log("Requesting camera permission");
        const permission = await Camera.requestCameraPermission();
        //console.log("Permission given: ", permission);
    }

    const codeScanner = useCodeScanner({
        codeTypes: ['ean-13'],
        onCodeScanned: (codes) => {
            console.log(`Scanned ${codes[0].value}`)
            getProduct(codes[0].value!!);
            //setActive(false)
        }
    })

    requestPermissions();

    Camera.requestCameraPermission();
    const device = useCameraDevice('back')
    const { hasPermission } = useCameraPermission()

    const CameraErr = () => {
        if (!hasPermission) return (<ThemedText>No permission.</ThemedText>)
        if (device == null) return (<ThemedText>No device.</ThemedText>)
        return <Camera
            style={{ width: '100%', height: 300 }}
            device={device}
            isActive={isActive}
            codeScanner={codeScanner}
        />
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
            <ThemedView><CameraErr /></ThemedView>
            <ThemedView><ThemedText>{testo}</ThemedText></ThemedView>
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