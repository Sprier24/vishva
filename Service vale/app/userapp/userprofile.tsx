import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, StyleSheet, TouchableOpacity, Alert, Dimensions,
    SafeAreaView, TextInput, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { account, databases } from '../../lib/appwrite';
import { Query, ID } from 'appwrite';

const { width } = Dimensions.get('window');

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = '681c429800281e8a99bd';

const ProfileScreen = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        image: 'https://i.pravatar.cc/150?img=8',
        aadharNo: '',
        panNo: '',
        city: '',
        category: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const currentUser = await account.get();
                const userEmail = currentUser.email;

                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_ID,
                    [Query.equal('email', userEmail)]
                );

                if (response.documents.length > 0) {
                    const userData = response.documents[0];
                    setUser({
                        name: userData.name,
                        email: userData.email,
                        phone: userData.contactNo || '+91 9876543210',
                        address: userData.address || '123, Main Street, City',
                        image: 'https://i.pravatar.cc/150?img=8',
                        aadharNo: userData.aadharNo || '',
                        panNo: userData.panNo || '',
                        city: userData.city || '',
                        category: userData.category || ''
                    });
                } else {
                    setUser({
                        name: currentUser.name || currentUser.email.split('@')[0],
                        email: currentUser.email,
                        phone: '+91 9876543210',
                        address: '123, Main Street, City',
                        image: 'https://i.pravatar.cc/150?img=8',
                        aadharNo: '',
                        panNo: '',
                        city: '',
                        category: ''
                    });
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching user data:', error);
                Alert.alert('Error', 'Failed to load user data');
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = async () => {
        try {
            await account.deleteSession('current');
            Alert.alert('Logged out');
            router.replace('/');
        } catch (error) {
            console.error('Logout Error:', error);
            Alert.alert('Error', (error as Error).message || 'Something went wrong');
        }
    };

    const handleSave = async () => {
        try {
            const currentUser = await account.get();
            const userEmail = currentUser.email;

            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [Query.equal('email', userEmail)]
            );

            if (response.documents.length > 0) {
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTION_ID,
                    response.documents[0].$id,
                    {
                        name: user.name,
                        address: user.address,
                        contactNo: user.phone,
                        city: user.city,
                        aadharNo: user.aadharNo,
                        panNo: user.panNo,
                        category: user.category
                    }
                );
            } else {
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTION_ID,
                    ID.unique(),
                    {
                        name: user.name,
                        email: user.email,
                        address: user.address,
                        contactNo: user.phone,
                        city: user.city,
                        aadharNo: user.aadharNo,
                        panNo: user.panNo,
                        category: user.category
                    }
                );
            }

            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Update Error:', error);
            Alert.alert('Error', 'Failed to update profile');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <Text>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Profile Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Profile</Text>
                </View>

                {/* Profile Image */}
                <View style={styles.profileImageContainer}>
                    <Image source={{ uri: user.image }} style={styles.profileImage} />
                    {isEditing && (
                        <TouchableOpacity style={styles.editImageButton}>
                            <Ionicons name="camera" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {isEditing ? (
                    <View style={styles.editFormContainer}>
                        {/* Edit Form Header */}
                        <View style={styles.editFormHeader}>
                            <Text style={styles.editFormTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={handleCancelEdit} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                value={user.name}
                                onChangeText={(text) => setUser({ ...user, name: text })}
                                placeholder="Enter your full name"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput
                                value={user.email}
                                editable={false}
                                style={[styles.input, styles.disabledInput]}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                value={user.phone}
                                onChangeText={(text) => setUser({ ...user, phone: text })}
                                placeholder="Enter phone number"
                                keyboardType="phone-pad"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Address</Text>
                            <TextInput
                                value={user.address}
                                onChangeText={(text) => setUser({ ...user, address: text })}
                                placeholder="Enter your address"
                                multiline
                                style={[styles.input, { height: 80 }]}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Aadhar Card Number</Text>
                            <TextInput
                                value={user.aadharNo}
                                onChangeText={(text) => setUser({ ...user, aadharNo: text })}
                                placeholder="Enter Aadhar number"
                                keyboardType="numeric"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>PAN Number</Text>
                            <TextInput
                                value={user.panNo}
                                onChangeText={(text) => setUser({ ...user, panNo: text.toUpperCase() })}
                                placeholder="Enter PAN number"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>City</Text>
                            <TextInput
                                value={user.city}
                                onChangeText={(text) => setUser({ ...user, city: text })}
                                placeholder="Enter your city"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Category</Text>
                            <TextInput
                                value={user.category}
                                onChangeText={(text) => setUser({ ...user, category: text })}
                                placeholder="Enter category"
                                style={styles.input}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.profileInfoContainer}>
                        <View style={styles.infoCard}>
                            <Text style={styles.name}>{user.name}</Text>
                            <Text style={styles.email}>{user.email}</Text>

                            <View style={styles.infoItem}>
                                <Ionicons name="call-outline" size={18} color="#4b5563" />
                                <Text style={styles.infoText}>Phone No: {user.phone}</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="location-outline" size={18} color="#4b5563" />
                                <Text style={styles.infoText}>Address: {user.address}</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="card-outline" size={18} color="#4b5563" />
                                <Text style={styles.infoText}>Aadhar No: {user.aadharNo || 'Not provided'}</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="document-outline" size={18} color="#4b5563" />
                                <Text style={styles.infoText}>PAN: {user.panNo || 'Not provided'}</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="business-outline" size={18} color="#4b5563" />
                                <Text style={styles.infoText}>City: {user.city || 'Not provided'}</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Ionicons name="pricetag-outline" size={18} color="#4b5563" />
                                <Text style={styles.infoText}>Category: {user.category || 'Not provided'}</Text>
                            </View>


                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={styles.logoutButton}
                                    onPress={handleLogout}
                                >
                                    <Ionicons name="log-out-outline" size={18} color="#fff" />
                                    <Text style={styles.logoutButtonText}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        paddingBottom: 40,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
        width: '100%',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1e293b',
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 20,
        alignSelf: 'center',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#e2e8f0',
    },
    editImageButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3b82f6',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    editFormContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 20,
        marginTop: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    editFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    editFormTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
    },
    closeButton: {
        padding: 5,
    },
    formGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1e293b',
    },
    disabledInput: {
        color: '#94a3b8',
        backgroundColor: '#f1f5f9',
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    profileInfoContainer: {
        padding: 20, // adds inner spacing from container edges
    },

    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    name: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
        textAlign: 'center',
    },
    email: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 20,
        textAlign: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10, // adds space between items
    },

    infoText: {
        fontSize: 15,
        color: '#475569',
        marginLeft: 10,
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20, // space above the buttons
    },

    editButton: {
        flex: 1,
        backgroundColor: '#3b82f6',
        padding: 14,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    logoutButton: {
        flex: 1,
        backgroundColor: '#ef4444',
        padding: 14,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default ProfileScreen;