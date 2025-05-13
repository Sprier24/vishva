import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { AntDesign, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import { useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = '681d92600018a87c1478';

type Service = {
  id: string;
  title: string;
  status: string;
  serviceType: string;
  clientName: string;
  address: string;
  phone: string;
  amount: string;
  serviceBoy?: string;
  date: string;
};
const HomeScreen = () => {
  const params = useLocalSearchParams();
  const [completedServices, setCompletedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch completed services from Appwrite
  const fetchCompletedServices = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('status', 'completed'),
          Query.orderDesc('$createdAt')
        ]
      );

      const formattedServices = response.documents.map(doc => ({
        id: doc.$id,
        title: `${doc.serviceType} - ${doc.clientName}`,
        status: doc.status,
        serviceType: doc.serviceType,
        clientName: doc.clientName,
        address: doc.address,
        phone: doc.phoneNumber,
        amount: doc.billAmount,
        serviceBoy: doc.serviceboyName,
        date: new Date(doc.$createdAt).toLocaleString()
      }));

      setCompletedServices(formattedServices);
    } catch (error) {
      console.error('Error fetching completed services:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchCompletedServices();

    // Check for newly completed service from navigation params
    if (params.completedService) {
      try {
        const newService = JSON.parse(params.completedService as string);
        setCompletedServices(prev => [{
          id: newService.id,
          title: `${newService.serviceType} - ${newService.clientName}`,
          status: 'Completed',
          serviceType: newService.serviceType,
          clientName: newService.clientName,
          address: newService.address,
          phone: newService.phone,
          amount: newService.amount,
          serviceBoy: newService.serviceBoy,
          date: newService.date || 'Just now'
        }, ...prev]);
      } catch (error) {
        console.error('Error parsing completed service:', error);
      }
    }
  }, [params.completedService]);

 const renderServiceCard = ({ item }: { item: Service }) => (
  <TouchableOpacity
    style={styles.serviceCard}
    onPress={() => {
      router.push({
        pathname: '/bill',
        params: {
          serviceData: JSON.stringify({
            serviceType: item.serviceType,
            serviceBoyName: item.serviceBoy,
            customerName: item.clientName,
            address: item.address,
            contactNumber: item.phone,
            serviceCharge: item.amount
          }),
        },
      });
    }}
  >
    <View style={styles.serviceHeader}>
      <Text style={styles.serviceType}>{item.serviceType}</Text>
      <View style={[styles.statusBadge, styles.completedBadge]}>
        <Text style={styles.statusText}>Completed</Text>
      </View>
    </View>
    <View style={styles.serviceDetails}>
      <View style={styles.detailRow}>
        <MaterialIcons name="person" size={16} color="#6B7280" />
        <Text style={styles.detailText}>{item.clientName}</Text>
      </View>
      <View style={styles.detailRow}>
        <MaterialIcons name="location-on" size={16} color="#6B7280" />
        <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
          {item.address}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <MaterialIcons name="phone" size={16} color="#6B7280" />
        <Text style={styles.detailText}>{item.phone}</Text>
      </View>
      <View style={styles.detailRow}>
        <MaterialCommunityIcons name="currency-inr" size={16} color="#6B7280" />
        <Text style={styles.detailText}>{Number(item.amount).toLocaleString('en-IN')}</Text>
      </View>
    </View>
    <View style={styles.serviceFooter}>
      <Text style={styles.serviceBoyText}>Assigned to: {item.serviceBoy}</Text>
      <Text style={styles.dateText}>{item.date}</Text>
    </View>
  </TouchableOpacity>
);

  return (
    <SafeAreaView style={styles.container}>
     {completedServices.length > 0 ? (
            <FlatList
              data={completedServices}
              renderItem={renderServiceCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="pending-actions" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No pending services</Text>
              <Text style={styles.emptySubtext}>All your services are up to date</Text>
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 10,
  },
  serviceDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
 serviceBoyText: {
  fontSize: 12,
  color: '#6B7280',
  fontStyle: 'italic',
  width: 150,           
  textAlign: 'left',   
},
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});

export default HomeScreen;