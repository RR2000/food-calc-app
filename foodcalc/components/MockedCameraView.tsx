import React, { useEffect, useState } from 'react';
import { Button, Platform, SafeAreaView, StyleSheet } from 'react-native';
import type { CameraDevice, CodeScanner } from 'react-native-vision-camera';
import { ThemedText } from './ThemedText';
import { CameraViewProps } from './CameraView';
import { TextInput } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BackendService } from '@/services/BackendService';

export const MockedCameraView: React.FC<CameraViewProps> = ({ isActive, setJson }) => {
    const [text, onChangeText] = React.useState('5449000169358');
    let bs: BackendService = new BackendService()
    const search = () => {
        bs.getProduct(text)
        .subscribe((json) => { setJson(json) })
    }
    return (
        <SafeAreaProvider>
            <SafeAreaView>
                <TextInput
                    style={styles.input}
                    onChangeText={onChangeText}
                    value={text}
                />
                <Button
                    onPress={search}
                    title="Search"
                    color="#841584"
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
    },
});