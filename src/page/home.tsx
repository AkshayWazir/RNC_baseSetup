import { Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sampleApi } from '../api/sample';
import { useEffect } from 'react';
import ReactNativeBiometrics from 'react-native-biometrics'
import { makeRequest } from '../utility/apiCaller';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        borderColor: "purple",
        borderWidth: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 16
    },
    preview: {
        marginTop: 24
    },
    previewTitle: {
        fontSize: 16,
        marginBottom: 12,
        fontWeight: '600'
    },
});

const rnBiometrics = new ReactNativeBiometrics()

export function HomeScreen({ navigation }: { navigation: any }) {
    const safeAreaInsets = useSafeAreaInsets();
    const containerStyles = [styles.container, { paddingTop: safeAreaInsets.top, paddingBottom: safeAreaInsets.bottom }];
    const { data, isLoading } = sampleApi();


    useEffect(() => {
        console.log("initiated");
        (async () => {
            const response = await makeRequest({ url: "https://jsonplaceholder.typicode.com/users", absoluteURL: true }).get();
            console.log("Response : ", response);
        })();
    }, []);

    useEffect(() => {
        console.log("Data : ", data);
    }, [data]);

    useEffect(() => {
        console.log("Loading : ", isLoading);
    }, [isLoading]);

    return (
        <View style={containerStyles}>
            <Text style={styles.title}>Home Screen</Text>
            <Pressable onPress={() => navigation.navigate("Details")} style={{ padding: 12, backgroundColor: "blue", borderRadius: 8, width: 150, alignItems: "center" }}>
                <Text style={{ color: "white" }}>Go to Details</Text>
            </Pressable>
            <Button title="Confirm Fingerprint" onPress={() => rnBiometrics.simplePrompt({ promptMessage: 'Confirm fingerprint' })} />
            <View style={styles.preview}>
                <Text style={styles.previewTitle}>React Navigation is integrated.</Text>
                <Text style={styles.previewTitle}>{JSON.stringify(data)}</Text>
                <Text style={styles.previewTitle}>{JSON.stringify(isLoading)}</Text>
            </View>
        </View>
    );
}