import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const dailyRevenue = 5000;
    const monthlyRevenue = 150000;

    const pendingServices = [
        { id: '1', title: 'Oil Change - Car A', status: 'Pending' },
        { id: '2', title: 'Brake Inspection - Car B', status: 'Pending' },
        { id: '3', title: 'Engine Repair - Car G', status: 'Pending' },
    ];

    const completedServices = [
        { id: '6', title: 'Engine Repair - Car C', status: 'Completed' },
        { id: '7', title: 'Tire Replacement - Car D', status: 'Completed' },
        { id: '8', title: 'Tire Replacement - Car H', status: 'Completed' }
    ];

    const pendingServicesCount = pendingServices.length;


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Service Dashboard</Text>
                    <TouchableOpacity style={styles.notificationIcon}>
                        <MaterialIcons name="notifications" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.replace('/login')}
                        style={[styles.notificationIcon, { marginLeft: 10, backgroundColor: '#e74c3c' }]}
                    >
                        <MaterialIcons name="logout" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.revenueContainer}>
                    <View style={[styles.card, styles.dailyRevenue]}>
                        <Text style={styles.cardTitle}>Daily Revenue</Text>
                        <Text style={styles.cardAmount}>₹{dailyRevenue.toLocaleString()}</Text>
                        <View style={styles.cardTrend}>
                            <AntDesign name="arrowup" size={14} color="#fff" />
                            <Text style={styles.trendText}>12% from yesterday</Text>
                        </View>
                    </View>

                    <View style={[styles.card, styles.monthlyRevenue]}>
                        <Text style={styles.cardTitle}>Monthly Revenue</Text>
                        <Text style={styles.cardAmount}>₹{monthlyRevenue.toLocaleString()}</Text>
                        <View style={styles.cardTrend}>
                            <AntDesign name="arrowup" size={14} color="#fff" />
                            <Text style={styles.trendText}>8% from last month</Text>
                        </View>
                    </View>
                </View>

                {/* Services Cards */}
                <View style={styles.servicesContainer}>
                    <View style={[styles.card, styles.pendingCard]}>
                        <View style={styles.cardHeader}>
                            <MaterialIcons name="pending-actions" size={24} color="#e67e22" />
                            <Text style={styles.cardTitle}>Pending          Services</Text>
                        </View>
                        <Text style={styles.cardCount}>{pendingServicesCount}</Text>
                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={() => router.push('/pending')}
                        >
                            <Text style={styles.viewButtonText}>View All</Text>
                            <AntDesign name="right" size={16} color="#3498db" />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, styles.completedCard]}>
                        <View style={styles.cardHeader}>
                            <MaterialIcons name="check-circle" size={24} color="#27ae60" />
                            <Text style={styles.cardTitle}>Completed Services</Text>
                        </View>
                        <Text style={styles.cardCount}>{completedServices.length}</Text>
                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={() => router.push('/completed')}
                        >
                            <Text style={styles.viewButtonText}>View All</Text>
                            <AntDesign name="right" size={16} color="#3498db" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <View style={styles.activityCard}>
                        <View style={styles.activityItem}>
                            <View style={[styles.activityIcon, { backgroundColor: '#e8f4f8' }]}>
                                <MaterialIcons name="car-repair" size={20} color="#3498db" />
                            </View>
                            <View style={styles.activityText}>
                                <Text style={styles.activityTitle}>Oil Change Completed</Text>
                                <Text style={styles.activityTime}>10 minutes ago</Text>
                            </View>
                        </View>
                        <View style={styles.activityItem}>
                            <View style={[styles.activityIcon, { backgroundColor: '#f0f8e8' }]}>
                                <MaterialIcons name="directions-car" size={20} color="#2ecc71" />
                            </View>
                            <View style={styles.activityText}>
                                <Text style={styles.activityTitle}>New Vehicle Added</Text>
                                <Text style={styles.activityTime}>1 hour ago</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.bottomButton}
                    onPress={() => router.push('/userapp/userprofile')}
                >
                    <MaterialIcons name="people" size={24} color="#3498db" />
                    <Text style={styles.bottomButtonText}>User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.bottomButton}
                    onPress={() => router.push('/bill')}
                >
                    <MaterialIcons name="receipt" size={24} color="#3498db" />
                    <Text style={styles.bottomButtonText}>Bill</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContainer: {
        padding: 16,
        paddingBottom: 80,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2c3e50',
    },
    notificationIcon: {
        backgroundColor: '#3498db',
        borderRadius: 20,
        padding: 8,
    },
    revenueContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    servicesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    card: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        elevation: 3,
    },
    dailyRevenue: {
        backgroundColor: '#3498db',
    },
    monthlyRevenue: {
        backgroundColor: '#2ecc71',
    },
    pendingCard: {
        backgroundColor: '#fff',
        borderLeftWidth: 4,
        borderLeftColor: '#e67e22',
    },
    completedCard: {
        backgroundColor: '#fff',
        borderLeftWidth: 4,
        borderLeftColor: '#27ae60',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    cardAmount: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardCount: {
        fontSize: 28,
        fontWeight: 'bold',
        marginVertical: 8,
        color: '#2c3e50',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTrend: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendText: {
        fontSize: 12,
        color: '#fff',
        marginLeft: 4,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    viewButtonText: {
        color: '#3498db',
        fontSize: 14,
        fontWeight: '500',
        marginRight: 4,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 12,
    },
    activityCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    activityText: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    activityTime: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    bottomButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#3498db',
        marginTop: 4,
    },
});

export default HomeScreen;