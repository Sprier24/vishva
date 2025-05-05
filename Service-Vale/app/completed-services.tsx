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
  
  const renderRow = ({ item }) => (
    <View style={styles.tableRow}>
      <View style={styles.tableCell}>
        <Text style={[styles.tableData, styles.idColumn]}>{item.id}</Text>
      </View>
      <View style={styles.tableCell}>
        <Text style={[styles.tableData, styles.serviceColumn]} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
      </View>
      <View style={styles.tableCell}>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => router.push(`/service-details/${item.id}`)}
        >
          <AntDesign name="eye" size={20} color="#3498db" />
        </TouchableOpacity>
      </View>
    </View>
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
              keyExtractor={(item) => item.id}
              ListHeaderComponent={renderHeader}
              renderItem={renderRow}
              scrollEnabled={false}
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
    width: width - 32, // Subtract padding from screen width
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
  viewButton: {
    alignItems: 'center',
    justifyContent: 'center',
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