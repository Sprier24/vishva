import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = '681c428b00159abb5e8b';
const NOTIFICATIONS_COLLECTION = 'note_id';

const AdminNotificationPage = () => {
    const [notifications, setNotifications] = useState<any[]>([]);

    const fetchNotifications = async () => {
        const res = await databases.listDocuments(
            DATABASE_ID,
            NOTIFICATIONS_COLLECTION,
            [Query.orderDesc('createdAt')]
        );
        setNotifications(res.documents.filter(doc => !doc.isRead));
    };

    const markAsRead = async (id: string) => {
        await databases.updateDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION, id, { isRead: true });
        fetchNotifications();
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.notificationCard}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <TouchableOpacity onPress={() => markAsRead(item.$id)}>
                <Text style={styles.close}>Dismiss</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <FlatList
            data={notifications}
            keyExtractor={(item) => item.$id}
            renderItem={renderItem}
            contentContainerStyle={styles.container}
        />
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },
    notificationCard: {
        backgroundColor: '#fef3c7',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10
    },
    title: { fontWeight: 'bold', fontSize: 16 },
    description: { marginVertical: 5 },
    close: { color: 'red', textAlign: 'right' }
});

export default AdminNotificationPage;