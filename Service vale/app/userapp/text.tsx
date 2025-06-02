import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { databases, account } from '../../lib/appwrite';
import { ID, Query } from 'appwrite';
import { styles } from '../../constants/userapp/PendingServicesScreenuser.styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isSameDay } from 'date-fns';
import { Platform, Linking } from 'react-native';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = '681d92600018a87c1478';
const NOTIFICATIONS_COLLECTION_ID = 'note_id';

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
  serviceDate: string;
  serviceTime: string;
  serviceboyEmail: string;
  serviceboyContact: string;
  sortDate: string;
  sortTime: string;
};

const PendingServicesScreenUser = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const params = useLocalSearchParams();
  const router = useRouter();

  const fetchServices = async () => {
    try {
      const currentUser = await account.get();
      const email = currentUser.email;
      setUserEmail(email);
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('status', 'pending'),
          Query.equal('serviceboyEmail', email),
          Query.orderAsc('serviceDate'),
          Query.orderAsc('serviceTime')
        ]
      );
      const formattedServices = response.documents.map(doc => {
        const [year, month, day] = doc.serviceDate.split('-');
        const displayDate = `${day}/${month}/${year}`;
        const [hours, minutes] = doc.serviceTime.split(':');
        const hourNum = parseInt(hours);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum % 12 || 12;
        const displayTime = `${displayHour}:${minutes} ${ampm}`;
        return {
          id: doc.$id,
          serviceType: doc.serviceType,
          clientName: doc.clientName,
          address: doc.address,
          phone: doc.phoneNumber,
          amount: doc.billAmount,
          status: doc.status,
          date: new Date(doc.$createdAt).toLocaleString(),
          serviceBoy: doc.serviceboyName,
          serviceDate: displayDate,
          serviceTime: displayTime,
          serviceboyEmail: doc.serviceboyEmail,
          serviceboyContact: doc.serviceboyContact,
          sortDate: doc.serviceDate,
          sortTime: doc.serviceTime
        };
      });
      formattedServices.sort((a, b) => {
        if (a.sortDate !== b.sortDate) {
          return a.sortDate.localeCompare(b.sortDate);
        }
        return a.sortTime.localeCompare(b.sortTime);
      });
      setAllServices(formattedServices);
      setServices(formattedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    if (params.newService) {
      try {
        const newService = JSON.parse(params.newService as string);
        if (newService.serviceboyEmail === userEmail) {
          const formattedService = {
            id: newService.id,
            serviceType: newService.serviceType,
            clientName: newService.clientName,
            address: newService.address,
            phone: newService.phoneNumber,
            amount: `₹${newService.billAmount || '0'}`,
            status: 'pending',
            date: 'Just now',
            serviceBoy: newService.serviceboyName,
            serviceDate: newService.serviceDate ?
              newService.serviceDate.split('-').reverse().join('/') : '',
            serviceTime: newService.serviceTime || '',
            serviceboyEmail: newService.serviceboyEmail || '',
            serviceboyContact: newService.serviceboyContact || '',
            sortDate: newService.serviceDate || '',
            sortTime: newService.serviceTime || ''
          };
          setAllServices(prev => [formattedService, ...prev]);
          setServices(prev => {
            if (!dateFilter || isSameDay(new Date(newService.serviceDate.split('-').join('/')), dateFilter)) {
              return [formattedService, ...prev];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error parsing new service:', error);
      }
    }
  }, [params.newService, userEmail]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateFilter(selectedDate);
      filterByDate(selectedDate);
    }
  };

  const filterByDate = (date: Date) => {
    const filtered = allServices.filter(service => {
      const [day, month, year] = service.serviceDate.split('/');
      const serviceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return isSameDay(serviceDate, date);
    });
    setServices(filtered);
  };

  const clearDateFilter = () => {
    setDateFilter(null);
    setServices(allServices);
  };

  const createNotification = async (description: string, userEmail: string) => {
    try {
      await databases.createDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        {
          description,
          isRead: false,
          createdAt: new Date().toISOString(),
          userEmail,
        }
      );
      console.log('Notification sent to:', userEmail);
    } catch (error) {
      console.error('Notification creation failed:', error);
    }
  };

  const handleComplete = async (id: string) => {
    Alert.alert(
      'Complete Service',
      'Are you sure this service is completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                id,
                { status: 'completed' }
              );

              const completedService = services.find(service => service.id === id);
              if (completedService) {
                // Send notification
                await createNotification(
                  `Your ${completedService.serviceType} service has been marked as completed.`,
                  completedService.serviceboyEmail
                );

                // Remove from list
                setServices(prev => prev.filter(service => service.id !== id));

                // Navigate
                router.push({
                  pathname: '/userapp/usercompleted',
                  params: {
                    completedService: JSON.stringify(completedService)
                  }
                });
              }
            } catch (error) {
              console.error('Error completing service:', error);
              Alert.alert('Error', 'Failed to complete service');
            }
          }
        }
      ]
    );
  };

  const sendManualWhatsAppNotification = (service: Service) => {
    // Format the message (same as scheduled messages)
    const message = `Dear ${service.clientName},\n\n` +
      `Your ${service.serviceType} service is scheduled for:\n` +
      `📅 Date: ${service.serviceDate}\n` +
      `⏰ Time: ${service.serviceTime}\n\n` +
      `Service Provider Details:\n` +
      `👨‍🔧 Name: ${service.serviceBoy}\n` +
      `📞 Contact: ${service.serviceboyContact}\n\n` +
      `Service Amount: ₹${service.amount}\n\n` +
      `Please be ready for the service. For any queries, contact us.\n\n` +
      `Thank you for choosing our service!`;

    // Format phone number (remove any non-digit characters)
    const phone = service.phone.replace(/\D/g, '');

    // Create WhatsApp URL
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

    // Try to open WhatsApp
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed');
        // Optionally offer to send via SMS instead
      }
    });
  };


  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceType}>{item.serviceType}</Text>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/userapp/PhotoComparisonPage',
            params: {
              notes: `Service: ${item.serviceType}\nClient: ${item.clientName}\nAddress: ${item.address}\nPhone: ${item.phone}\nAmount: ₹${item.amount}\nDate: ${item.serviceDate} at ${item.serviceTime}`
            }
          })}
        >
          <MaterialIcons name="photo-camera" size={24} color="#4B5563" style={{ marginLeft: 10 }} />
        </TouchableOpacity>
        <View style={[styles.statusBadge, styles.pendingBadge]}>
          <Text style={styles.statusText}>Pending</Text>
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
          <Text style={styles.detailText}>
            {isNaN(Number(item.amount)) ? '0' : Number(item.amount).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
      <View style={styles.serviceFooter}>
        <Text style={styles.dateText}>
          Scheduled on {item.serviceDate} • {item.serviceTime}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.completeButton}
        onPress={() => handleComplete(item.id)}
      >
        <Text style={styles.completeButtonText}>Mark as Completed</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.whatsappButton, styles.actionButton]}
        onPress={() => sendManualWhatsAppNotification(item)}
      >
        <MaterialCommunityIcons name="whatsapp" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          dateFilter && styles.activeFilter
        ]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.filterButtonText}>
          {dateFilter ? format(dateFilter, 'dd/MM/yy') : 'Filter by Date'}
        </Text>
        <MaterialIcons name="event" size={20} color="#fff" />
      </TouchableOpacity>
      {dateFilter && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>Showing: {format(dateFilter, 'MMMM d, yyyy')}</Text>
          <TouchableOpacity onPress={clearDateFilter}>
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
      {showDatePicker && (
        <DateTimePicker
          value={dateFilter || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Pending Services</Text>
        <View style={styles.headerCountContainer}>
          <Text style={styles.headerCountText}>{services.length}</Text>
        </View>
      </View>
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
          <Text style={styles.emptyText}>
            {dateFilter
              ? `No pending services on ${format(dateFilter, 'MMMM d, yyyy')}`
              : 'No pending services assigned to you'
            }
          </Text>
          <Text style={styles.emptySubtext}>All your assigned services are completed</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PendingServicesScreenUser;