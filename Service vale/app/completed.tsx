import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = () => {

  const completedServices = [
    { id: '1', title: 'Engine Repair - Car C', status: 'Completed' },
    { id: '2', title: 'Tire Replacement - Car D', status: 'Completed' },
    { id: '3', title: 'Tire Replacement - Car H', status: 'Completed' }
  ];

  const renderServiceCard = ({ item }: { item: { id: string; title: string; status: string } }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => router.push(`/service`)}
    >
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceType}>{item.title}</Text>
        <View style={[styles.statusBadge, styles.completedBadge]}>
          <Text style={styles.statusText}>Completed</Text>
        </View>
      </View>

      <View style={styles.serviceFooter}>
        <TouchableOpacity style={styles.viewButton}>
          <AntDesign name="eye" size={20} color="#2563EB" />
          <Text style={styles.viewText}>View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <View style={styles.tableHeaderCell}>
        <Text style={[styles.tableHeaderText, styles.idColumn]}>ID</Text>
      </View>
      <View style={styles.tableHeaderCell}>
        <Text style={[styles.tableHeaderText, styles.serviceColumn]}>Service</Text>
      </View>
      <View style={styles.tableHeaderCell}>
        <Text style={[styles.tableHeaderText, styles.actionColumn]}>Action</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Service Dashboard</Text>
          <TouchableOpacity style={styles.notificationIcon}>
            <MaterialIcons name="notifications" size={24} color="#fff" />
          </TouchableOpacity>
        </View>


        <View style={styles.tableContainer}>
          <View style={styles.tableTitleContainer}>
            <Text style={styles.tableTitle}>Completed Services</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tableWrapper}>
            <FlatList
              data={completedServices}
              renderItem={renderServiceCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        </View>
      </ScrollView>
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
    marginBottom: 24,
  },
  revenueBox: {
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
  revenueTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  revenueTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  tableWrapper: {
    width: width - 32,
  },
  tableTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  viewAllText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
  },
  tableHeaderCell: {
    paddingRight: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7f8c8d',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tableCell: {
    paddingRight: 8,
  },
  tableData: {
    fontSize: 14,
    color: '#34495e',
  },
  idColumn: {
    width: 40,
  },
  serviceColumn: {
    width: width - 160, // Adjust based on your needs
  },
  actionColumn: {
    width: 60,
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
  listContainer: {
    padding: 16,
  },
  
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  serviceType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  completedBadge: {
    backgroundColor: '#D1FAE5',
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#065F46',
  },
  
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  viewText: {
    marginLeft: 6,
    color: '#2563EB',
    fontWeight: '500',
    fontSize: 14,
  },
  
});

export default HomeScreen;