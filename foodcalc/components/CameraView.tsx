import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import type { CameraDevice, CodeScanner } from 'react-native-vision-camera';
import { ThemedText } from './ThemedText';
import { debounce } from 'lodash';
import { BackendService } from '@/services/BackendService';
import { ProductDTO } from '@/dtos/ProductDTO';

export type CameraViewProps = {
    setActivate: React.Dispatch<React.SetStateAction<boolean>>
    isActive: boolean,
    setJson: React.Dispatch<React.SetStateAction<ProductDTO>>
};

export const CameraView: React.FC<CameraViewProps> = ({ isActive, setJson }) => {
    const [device, setDevice] = useState<CameraDevice | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean>(false);

    let bs: BackendService = new BackendService()

    useEffect(() => {
        const init = async () => {
            if (Platform.OS === 'web') return;

            const permission = await Camera.requestCameraPermission();
            setHasPermission(permission === 'granted');

            const devices = await Camera.getAvailableCameraDevices();
            const back = devices.find((d) => d.position === 'back');
            setDevice(back ?? null);
        };

        init();
    }, []);

    //const getProductDebounced = debounce(getProduct, 1000, { trailing: true });

    const codeScanner: CodeScanner = {
        codeTypes: ['ean-13'],
        onCodeScanned: (codes) => {
            bs.getProduct(codes[0].value!!)
                .subscribe((json) => { setJson(json) })
        }
    }

    if (!hasPermission) {
        return <ThemedText>No permission.</ThemedText>;
    }

    if (!device) {
        return <ThemedText>No device.</ThemedText>;
    }

    return (
        <Camera
            style={{ width: '100%', height: 300 }}
            device={device}
            isActive={isActive}
            codeScanner={codeScanner}
        />
    );
}
