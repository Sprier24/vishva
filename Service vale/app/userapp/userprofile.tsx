import React, { useState } from 'react';
import {
    View, Text, Image, StyleSheet, TouchableOpacity, Alert, Dimensions,
    SafeAreaView, TextInput, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 9876543210',
        address: '123, Main Street, City',
        image: 'https://i.pravatar.cc/150?img=8',
    });

    const handleLogout = async () => {
        try {
            Alert.alert('Logged out');
            router.replace('/');
        } catch (error) {
            console.error('Logout Error:', error);
            Alert.alert('Error', (error as Error).message || 'Something went wrong');
        }
    };

    const handleSave = () => {
        setIsEditing(false);
        Alert.alert('Profile updated');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Image source={{ uri: user.image }} style={styles.profileImage} />

                {isEditing ? (
                    <>
                        <TextInput
                            value={user.name}
                            onChangeText={(text) => setUser({ ...user, name: text })}
                            placeholder="Name"
                            style={styles.input}
                        />
                        <TextInput
                            value={user.email}
                            editable={false}
                            placeholder="Email"
                            keyboardType="email-address"
                            style={[styles.input, { backgroundColor: '#eee', color: '#888' }]}
                        />
                        <TextInput
                            value={user.phone}
                            onChangeText={(text) => setUser({ ...user, phone: text })}
                            placeholder="Phone"
                            keyboardType="phone-pad"
                            style={styles.input}
                        />
                        <TextInput
                            value={user.address}
                            onChangeText={(text) => setUser({ ...user, address: text })}
                            placeholder="Address"
                            multiline
                            style={[styles.input, { height: 80 }]}
                        />
                    </>
                ) : (
                    <>
                        <Text style={styles.name}>{user.name}</Text>
                        <Text style={styles.email}>{user.email}</Text>
                    </>
                )}

                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                    >
                        <Ionicons name={isEditing ? 'save-outline' : 'create-outline'} size={20} color="#fff" />
                        <Text style={styles.buttonText}>{isEditing ? 'Save Profile' : 'Edit Profile'}</Text>
                    </TouchableOpacity>

                    {!isEditing && (
                        <TouchableOpacity
                            style={[styles.button, styles.logoutButton]}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Logout</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    container: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 20,
        backgroundColor: '#f5f7fa',
    },
    profileImage: {
        width: width * 0.35,
        height: width * 0.35,
        borderRadius: (width * 0.35) / 2,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    name: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
    },
    email: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    phone: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
        marginBottom: 8,
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        alignItems: 'center',
        gap: 16,
        marginTop: 20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 50,
        width: '100%',
        justifyContent: 'center',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '500',
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 12,
        marginBottom: 10,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ccc',
    },
});
