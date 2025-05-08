  import React, { useState } from 'react';
  import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Dimensions, Alert } from 'react-native';
  import { useLocalSearchParams, useRouter } from 'expo-router';
  import { AntDesign, MaterialIcons } from '@expo/vector-icons';

  const { width } = Dimensions.get('window');
  type Service = {
    id: string;
    serviceType: string;
    clientName: string;
    address: string;
    phone: string;
    amount: string;
    status: string;
    date: string;
    serviceBoy: string;
  };
  
  const PendingServicesScreen = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    
    // Initial mock data
    const [services, setServices] = useState([
      { 
        id: '1', 
        serviceType: 'AC Repair', 
        clientName: 'John Smith',
        address: '123 Main St, Apt 4B',
        phone: '555-123-4567',
        amount: '₹1,500',
        status: 'Pending',
        date: 'Today, 10:30 AM',
        serviceBoy: 'Robert Brown'
      },
      { 
        id: '2', 
        serviceType: 'Washing Machine', 
        clientName: 'Sarah Johnson',
        address: '456 Oak Ave',
        phone: '555-987-6543',
        amount: '₹2,300',
        status: 'Pending',
        date: 'Today, 2:15 PM',
        serviceBoy: 'Jane Smith'
      }
    ]);

    // Check for new service data when component mounts or params change
    React.useEffect(() => {
      if (params.newService) {
        try {
          const newService = JSON.parse(params.newService as string);
          const newServiceEntry = {
            id: (services.length + 1).toString(),
            serviceType: newService.serviceType,
            clientName: newService.clientName,
            address: newService.address,
            phone: newService.phoneNumber,
            amount: `₹${newService.billAmount || '0'}`,
            status: 'Pending',
            date: 'Just now',
            serviceBoy: newService.serviceboyName
          };
          setServices(prev => [newServiceEntry, ...prev]);
        } catch (error) {
          console.error('Error parsing new service data:', error);
        }
      }
    }, [params.newService]);
    
    const handleComplete = (id: string) => {
      Alert.alert(
        'Complete Service',
        'Are you sure this service is completed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            style: 'destructive',
            onPress: () => {
              setServices(prev => prev.filter(service => service.id !== id));
              // Simulate storing the completed service or navigating
              router.push('/completed'); // or wherever the completed service list is
            }
          }
        ]
      );
    };

    const renderServiceItem = ({ item }: { item: Service }) => (
      <TouchableOpacity 
        style={styles.serviceCard}
        onPress={() => router.push({
          pathname: '/service',
          params: { serviceId: item.id }
        })}
      >
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceType}>{item.serviceType}</Text>
          <View style={[styles.statusBadge, item.status === 'Pending' && styles.pendingBadge]}>
            <Text style={styles.statusText}>{item.status}</Text>
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
            <MaterialIcons name="attach-money" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.amount}</Text>
          </View>
        </View>
        
        <View style={styles.serviceFooter}>
          <Text style={styles.dateText}>{item.date}</Text>
          <Text style={styles.serviceBoyText}>Assigned to: {item.serviceBoy}</Text>
        </View>

        <TouchableOpacity
        style={styles.completeButton}
        onPress={() => handleComplete(item.id)}
      >
        <Text style={styles.completeButtonText}>Mark as Completed</Text>
      </TouchableOpacity>
    </TouchableOpacity>

    );

    return (
      <SafeAreaView style={styles.container}>
        
        {services.length > 0 ? (
          <FlatList
            data={services}
            renderItem={renderServiceItem}
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
      backgroundColor: '#F9FAFB',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      backgroundColor: '#FFFFFF',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
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
    pendingBadge: {
      backgroundColor: '#FEF3C7',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#92400E',
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
      flexShrink: 1,
    },
    serviceFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
      paddingTop: 12,
    },
    dateText: {
      fontSize: 12,
      color: '#6B7280',
    },
    serviceBoyText: {
      fontSize: 12,
      color: '#6B7280',
      fontStyle: 'italic',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '500',
      color: '#6B7280',
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: '#9CA3AF',
      marginTop: 8,
    },
    completeButton: {
      marginTop: 12,
      backgroundColor: '#10B981',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    completeButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
  });

  export default PendingServicesScreen;