import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, Dimensions, TextInput, Modal, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { databases, storage, account } from '../../lib/appwrite';
import { ID } from 'appwrite';
import { Query } from 'appwrite';
import { useRouter } from 'expo-router';
import mime from 'mime';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { styles } from '../../constants/userapp/Userphoto';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'photo_id';
const NOTIFICATIONS_COLLECTION = 'note_id';
const BUCKET_ID = 'photo_id';
const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const STORAGE_BASE_URL = 'https://fra.cloud.appwrite.io/v1/storage/buckets/photo_id/files';
const PROJECT_ID = '681b300f0018fdc27bdd';

const buildImageUrl = (fileId: string) =>
    `${STORAGE_BASE_URL}/${fileId}/view?project=${PROJECT_ID}&mode=admin`;

type ImagePickerResult = {
    uri: string;
    fileName?: string;
    fileSize?: number;
    type?: string;
};

type PhotoSet = {
    $id: string;
    beforeImageUrl: string;
    afterImageUrl: string;
    notes?: string;
    date: string;
};

const PhotoComparisonPage = () => {
    const [beforeImage, setBeforeImage] = useState<ImagePickerResult | null>(null);
    const [afterImage, setAfterImage] = useState<ImagePickerResult | null>(null);
    const { notes: initialNotes } = useLocalSearchParams();
    const [notes, setNotes] = useState(Array.isArray(initialNotes) ? initialNotes.join('\n') : initialNotes || '');
    const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const router = useRouter();

    const parseNotes = (notes: string) => {
        if (!notes) return { userName: '', userNotes: '' };
        const [userName, ...rest] = notes.split('\n');
        return {
            userName: userName?.trim() || '',
            userNotes: rest.join('\n').trim(),
        };
    };

    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            try {
                const user = await account.get();
                setIsAuthenticated(!!user?.$id);
                setUserEmail(user.email);
                setUserName(user.name);
                if (!notes.startsWith(user.name)) {
                    setNotes(`${user.name}\n${notes}`);
                }
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchPhotoSets();
    }, [isAuthenticated]);

    const fetchPhotoSets = async () => {
        setIsLoading(true);
        try {
            const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
                Query.equal('userEmail', userEmail),
                Query.orderDesc('date'),
                Query.limit(20),
            ]);
            const safeDocs: PhotoSet[] = response.documents.map((doc: any) => ({
                $id: doc.$id,
                beforeImageUrl: doc.beforeImageUrl,
                afterImageUrl: doc.afterImageUrl,
                notes: doc.notes,
                date: doc.date,
            }));
            setPhotoSets(safeDocs);
        } catch (error) {
            Alert.alert('Error', 'Failed to load photos.');
        } finally {
            setIsLoading(false);
        }
    };

    const takePhoto = async (setImage: (image: ImagePickerResult | null) => void) => {
        if (!isAuthenticated) {
            Alert.alert('Login Required', 'Please log in to upload photos');
            router.push('/login');
            return;
        }
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
            Alert.alert('Permission Denied', 'Camera access is required');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
        });
        if (!result.canceled && result.assets.length > 0) {
            const asset = result.assets[0];
            setImage({
                uri: asset.uri,
                fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
                fileSize: asset.fileSize ?? 0,
                type: asset.type ?? 'image/jpeg',
            });
        }
    };

    const uploadImageToStorage = async (image: ImagePickerResult): Promise<string> => {
        try {
            const uri = image.uri;
            const name = image.fileName ?? `photo_${Date.now()}.jpg`;
            const type = mime.getType(uri) || 'image/jpeg';
            const file = {
                uri,
                name,
                type,
                size: image.fileSize ?? 0,
            };
            const uploadedFile = await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                file
            );
            if (!uploadedFile || !uploadedFile.$id) {
                throw new Error('File upload returned an invalid response');
            }
            return uploadedFile.$id;
        } catch (error) {
            throw new Error('Failed to upload image. Check Appwrite settings.');
        }
    };

    const createNotification = async (description: string, relatedDocumentId: string) => {
        const notifId = ID.unique();
        try {
            await databases.createDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION, notifId, {
                description,
                isRead: false,
                createdAt: new Date().toISOString(),
                userEmail,
            });
            console.log('Notification created successfully:', notifId);
        } catch (error: any) {
            console.error('Failed to create notification:', {
                message: error.message,
                code: error.code,
                type: error.type,
                response: error.response
            });
        }
    };

    const handleSubmit = async () => {
        if (!isAuthenticated) {
            Alert.alert('Login Required', 'Please log in first.');
            router.push('/login');
            return;
        }
        if (!beforeImage && !afterImage) {
            Alert.alert('Missing Image', 'Take at least one photo.');
            return;
        }
        setIsUploading(true);
        try {
            const notesWithName = userName ? `${userName}\n${notes}` : notes;
            if (beforeImage && !afterImage) {
                const beforeFileId = await uploadImageToStorage(beforeImage);
                const docId = ID.unique();
                await databases.createDocument(DATABASE_ID, COLLECTION_ID, docId, {
                    beforeImageUrl: beforeFileId,
                    afterImageUrl: '',
                    notes: notesWithName,
                    date: new Date().toISOString(),
                    userEmail: userEmail,
                });
                await createNotification(
                    `New BEFORE photo added. Notes: ${notesWithName || 'No notes provided'}`,
                    docId
                );
            } else if (afterImage && !beforeImage) {
                const afterFileId = await uploadImageToStorage(afterImage);
                const latest = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
                    Query.orderDesc('date'),
                    Query.equal('afterImageUrl', ''),
                    Query.equal('userEmail', userEmail),
                    Query.limit(1),
                ]);
                if (latest.documents.length === 0) {
                    throw new Error('No matching before image found');
                }
                const docId = latest.documents[0].$id;
                await databases.updateDocument(DATABASE_ID, COLLECTION_ID, docId, {
                    afterImageUrl: afterFileId,
                    notes: notesWithName,
                    userEmail: userEmail,
                });
                await createNotification(
                    `AFTER photo added to existing set. Notes: ${notesWithName || 'No notes provided'}`,
                    docId
                );
            } else {
                const [beforeFileId, afterFileId] = await Promise.all([
                    uploadImageToStorage(beforeImage!),
                    uploadImageToStorage(afterImage!),
                ]);
                const docId = ID.unique();
                await databases.createDocument(DATABASE_ID, COLLECTION_ID, docId, {
                    beforeImageUrl: beforeFileId,
                    afterImageUrl: afterFileId,
                    notes: notesWithName,
                    date: new Date().toISOString(),
                    userEmail: userEmail,
                });
                await createNotification(
                    `COMPLETE: BEFORE and AFTER photos submitted! User: ${userName || 'Unknown'}`,
                    docId
                );
            }
            Alert.alert('Success', 'Photo saved.');
            setBeforeImage(null);
            setAfterImage(null);
            setNotes(userName ? `${userName}\n` : '');
            fetchPhotoSets();
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const openPreview = (imageUrl: string) => {
        setPreviewImageUrl(imageUrl);
        setPreviewVisible(true);
    };

    const closePreview = () => {
        setPreviewVisible(false);
        setPreviewImageUrl(null);
    };

    const deletePhotoSet = async (photoSet: PhotoSet) => {
        setIsLoading(true);
        try {
            const deletePromises = [];
            if (photoSet.beforeImageUrl) {
                deletePromises.push(storage.deleteFile(BUCKET_ID, photoSet.beforeImageUrl));
            }
            if (photoSet.afterImageUrl) {
                deletePromises.push(storage.deleteFile(BUCKET_ID, photoSet.afterImageUrl));
            }
            await Promise.all(deletePromises);
            await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, photoSet.$id);
            Alert.alert('Deleted', 'Photo set deleted successfully.');
            fetchPhotoSets();
        } catch (error) {
            Alert.alert('Error', 'Failed to delete photo set.');
        } finally {
            setIsLoading(false);
        }
    };

    const saveBothImages = async (item: PhotoSet) => {
        setIsLoading(true);
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Needed',
                    'Allow access to save images to your gallery.',
                );
                setIsLoading(false);
                return;
            }
            const saveToGallery = async (fileId: string | undefined) => {
                if (!fileId) return null;
                try {
                    const uri = buildImageUrl(fileId);
                    const filename = `photo_${Date.now()}.jpg`;
                    const localPath = `${FileSystem.cacheDirectory}${filename}`;
                    await FileSystem.downloadAsync(uri, localPath);
                    const asset = await MediaLibrary.createAssetAsync(localPath);
                    return asset;
                } catch (error) {
                    console.error('Save failed:', error);
                    return null;
                }
            };
            await Promise.all([
                saveToGallery(item.beforeImageUrl),
                saveToGallery(item.afterImageUrl),
            ]);
            Alert.alert('Success', 'Images saved to your gallery!');
            fetchPhotoSets();
        } catch (error) {
            console.error('Operation failed:', error);
            Alert.alert('Error', 'Failed to save images. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6B46C1" />
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.authContainer}>
                <Text style={styles.authText}>Please log in to access this feature</Text>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.push('/login')}
                >
                    <Text style={styles.loginButtonText}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { marginRight: 150 }]}>Photo </Text>
                <View style={styles.headerIcons}></View>
            </View>

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Capture Photos</Text>
                    <View style={styles.photoButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.photoButton, beforeImage && styles.photoButtonActive]}
                            onPress={() => takePhoto(setBeforeImage)}
                        >
                            <Ionicons
                                name="camera"
                                size={24}
                                color={beforeImage ? "#fff" : "#6B46C1"}
                            />
                            <Text style={[styles.photoButtonText, beforeImage && styles.photoButtonTextActive]}>
                                Before
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.photoButton, afterImage && styles.photoButtonActive]}
                            onPress={() => takePhoto(setAfterImage)}
                        >
                            <Ionicons
                                name="camera"
                                size={24}
                                color={afterImage ? "#fff" : "#6B46C1"}
                            />
                            <Text style={[styles.photoButtonText, afterImage && styles.photoButtonTextActive]}>
                                After
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {beforeImage || afterImage ? (
                        <View style={styles.previewContainer}>
                            <View style={styles.imagePreviewWrapper}>
                                {beforeImage && (
                                    <>
                                        <Text style={styles.previewLabel}>Before</Text>
                                        <Image
                                            source={{ uri: beforeImage.uri }}
                                            style={styles.imagePreview}
                                        />
                                        <TouchableOpacity
                                            style={styles.clearButton}
                                            onPress={() => setBeforeImage(null)}
                                        >
                                            <Ionicons name="close" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                            <View style={styles.imagePreviewWrapper}>
                                {afterImage && (
                                    <>
                                        <Text style={styles.previewLabel}>After</Text>
                                        <Image
                                            source={{ uri: afterImage.uri }}
                                            style={styles.imagePreview}
                                        />
                                        <TouchableOpacity
                                            style={styles.clearButton}
                                            onPress={() => setAfterImage(null)}
                                        >
                                            <Ionicons name="close" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.instructionText}>
                            Take at least one photo to get started
                        </Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <TextInput
                        placeholder={`Add your notes about the progress...`}
                        placeholderTextColor="#999"
                        value={notes}
                        onChangeText={setNotes}
                        style={styles.notesInput}
                        multiline
                        editable={!isUploading}
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (isUploading || (!beforeImage && !afterImage)) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={isUploading || (!beforeImage && !afterImage)}
                >
                    {isUploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Save Progress</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Progress History</Text>

                    {photoSets.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="images" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyStateText}>No progress photos yet</Text>
                        </View>
                    ) : (
                        photoSets.map((item) => (
                            <View key={item.$id} style={styles.uploadCard}>
                                <View style={styles.uploadHeader}>
                                    <Text style={styles.uploadDate}>
                                        {new Date(item.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                    <View style={styles.iconContainer}>
                                        <TouchableOpacity
                                            onPress={() =>
                                                Alert.alert('Confirm Delete', 'Are you sure you want to delete this photo set?', [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Delete',
                                                        style: 'destructive',
                                                        onPress: () => deletePhotoSet(item),
                                                    },
                                                ])
                                            }
                                        >
                                            <Ionicons name="trash" size={20} color="#DC2626" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() =>
                                                Alert.alert('Confirm Download', 'Are you sure you want to download this photo set?', [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Download',
                                                        style: 'destructive',
                                                        onPress: () => saveBothImages(item),
                                                    },
                                                ])
                                            }
                                            style={{ marginLeft: 16 }}
                                        >
                                            <Ionicons name="download" size={20} color="#3B82F6" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.comparisonContainer}>
                                    <View style={styles.comparisonItem}>
                                        <Text style={styles.comparisonLabel}>Before</Text>
                                        {item.beforeImageUrl ? (
                                            <TouchableOpacity
                                                onPress={() => openPreview(buildImageUrl(item.beforeImageUrl))}
                                            >
                                                <Image
                                                    source={{ uri: buildImageUrl(item.beforeImageUrl) }}
                                                    style={styles.comparisonImage}
                                                />
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.placeholderImage}>
                                                <Ionicons name="image" size={32} color="#D1D5DB" />
                                                <Text style={styles.placeholderText}>No before image</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.comparisonItem}>
                                        <Text style={styles.comparisonLabel}>After</Text>
                                        {item.afterImageUrl ? (
                                            <TouchableOpacity
                                                onPress={() => openPreview(buildImageUrl(item.afterImageUrl))}
                                            >
                                                <Image
                                                    source={{ uri: buildImageUrl(item.afterImageUrl) }}
                                                    style={styles.comparisonImage}
                                                />
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.placeholderImage}>
                                                <Ionicons name="image" size={32} color="#D1D5DB" />
                                                <Text style={styles.placeholderText}>No after image</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {item.notes && (
                                    <View style={styles.notesContainer}>
                                        {parseNotes(item.notes).userName !== '' && (
                                            <Text style={styles.notesUserName}>
                                                {parseNotes(item.notes).userName}
                                            </Text>
                                        )}
                                        <Text style={styles.notesText}>
                                            {parseNotes(item.notes).userNotes || 'No notes provided'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>

                <Modal
                    visible={previewVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={closePreview}
                >
                    <Pressable style={styles.modalBackground} onPress={closePreview}>
                        {previewImageUrl && (
                            <Image
                                source={{ uri: previewImageUrl }}
                                style={styles.fullscreenImage}
                                resizeMode="contain"
                            />
                        )}
                        <TouchableOpacity
                            style={styles.closePreviewButton}
                            onPress={closePreview}
                        >
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                    </Pressable>
                </Modal>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default PhotoComparisonPage;