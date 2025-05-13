import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { account, databases } from '../lib/appwrite';
import { RefreshControl } from 'react-native';
import { Query } from 'appwrite';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'bill_ID';
const ORDERS_COLLECTION_ID = '681d92600018a87c1478';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      Alert.alert('Logged Out', 'You have been successfully logged out');
      router.replace('/');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const fetchRevenueData = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // Fetch today's bills
      const dailyBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.greaterThanEqual('date', startOfDay),
          Query.orderDesc('date')
        ]
      );

      // Fetch this month's bills
      const monthlyBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.greaterThanEqual('date', startOfMonth),
          Query.orderDesc('date')
        ]
      );

      // Calculate daily revenue
      const dailyTotal = dailyBills.documents.reduce((sum, bill) => {
        return sum + parseFloat(bill.total || 0);
      }, 0);

      // Calculate monthly revenue
      const monthlyTotal = monthlyBills.documents.reduce((sum, bill) => {
        return sum + parseFloat(bill.total || 0);
      }, 0);

      setDailyRevenue(dailyTotal);
      setMonthlyRevenue(monthlyTotal);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const orders = await databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID);

      const pending = orders.documents.filter(o => o.status === 'pending').length;
      const completed = orders.documents.filter(o => o.status !== 'pending').length;

      setPendingCount(pending);
      setCompletedCount(completed);
    } catch (error) {
      console.error('Appwrite error:', error);
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchRevenueData(), fetchOrders()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData().finally(() => setRefreshing(false));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
            tintColor={'#3498db'}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Service Dashboard</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={[styles.notificationIcon, { marginRight: 10 }]}
              onPress={() => console.log('Notifications pressed')}
            >
              <MaterialIcons name="notifications" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutIcon}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.revenueContainer}>
          <View style={[styles.card, styles.dailyRevenue]}>
            <Text style={styles.cardTitle}>Daily Revenue</Text>
            <Text style={styles.cardAmount}>₹{dailyRevenue.toLocaleString('en-IN')}</Text>
            <View style={styles.cardTrend}>
              <AntDesign name="arrowup" size={14} color="#fff" />
              <Text style={styles.trendText}>Today</Text>
            </View>
          </View>

          <View style={[styles.card, styles.monthlyRevenue]}>
            <Text style={styles.cardTitle}>Monthly Revenue</Text>
            <Text style={styles.cardAmount}>₹{monthlyRevenue.toLocaleString('en-IN')}</Text>
            <View style={styles.cardTrend}>
              <AntDesign name="arrowup" size={14} color="#fff" />
              <Text style={styles.trendText}>This Month</Text>
            </View>
          </View>
        </View>

        {/* Services Cards */}
        <View style={styles.servicesContainer}>
          <View style={[styles.card, styles.pendingCard]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="pending-actions" size={24} color="#e67e22" />
              <Text style={styles.cardTitle}>Pending    Services</Text>
            </View>
            <Text style={styles.cardCount}>{pendingCount}</Text>
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
            <Text style={styles.cardCount}>{completedCount}</Text>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => router.push('/completed')}
            >
              <Text style={styles.viewButtonText}>View All</Text>
              <AntDesign name="right" size={16} color="#3498db" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push('/service')}
        >
          <MaterialIcons name="car-repair" size={24} color="#3498db" />
          <Text style={styles.bottomButtonText}>Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push('/user')}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    backgroundColor: '#3498db',
    borderRadius: 20,
    padding: 8,
  },
  logoutIcon: {
    backgroundColor: '#e74c3c',
    borderRadius: 20,
    padding: 8,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
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
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  bottomButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3498db',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;