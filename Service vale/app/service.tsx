import React, {useState,useEffect} from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = '681c429800281e8a99bd';

type ServiceKey = 'AC' | 'Washing Machine' | 'Fridge' | 'Microwave';

const ServicePage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState<{id: string, name: string}[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceKey>('AC');
  const router = useRouter();

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.orderDesc('$createdAt')]
        );
        
        const users = response.documents.map(doc => ({
          id: doc.$id,
          name: doc.name
        }));
        
        setAllUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchAllUsers();
  }, []);

  const handleImagePress = (serviceKey: ServiceKey) => {
    setSelectedServiceType(serviceKey);
    setModalVisible(true);
  };

  const handleApplicantPress = (applicantId: string, applicantName: string) => {
    setModalVisible(false);
    router.push({
      pathname: '/order',
      params: {
        applicantId,
        applicantName,
        serviceType: selectedServiceType,
      },
    });
  };

  const handleLearnMore = () => {
    Alert.alert('Learn More', 'Here you can navigate to detailed service info.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
<Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Applicants for this service</Text>
      {allUsers.length > 0 ? (
        allUsers.map((user, index) => (
          <TouchableOpacity key={index} onPress={() => handleApplicantPress(user.id, user.name)}>
          <View style={styles.applicantItem}>
            <Text style={styles.applicantName}>{user.name}</Text>
          </View>
        </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noApplicantsText}>No applicants yet</Text>
      )}
      
      <TouchableOpacity   
        style={styles.modalCloseButton}
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.modalCloseButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      <View style={styles.serviceBox}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={() => handleImagePress('AC')}>
            <Image
              source={require('../assets/images/ac.jpg')}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>A.C Repair And Services:</Text>
        <Text style={styles.description}>
          Expert A.C repair and maintenance services to keep your cooling system efficient. Fast, reliable, and professional solutions for optimal comfort.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleLearnMore}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceBox}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={() => handleImagePress('Washing Machine')}>
            <Image
              source={require('../assets/images/washingmachine.jpg')}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Washing Machine Repair:</Text>
        <Text style={styles.description}>
          We provide efficient washing machine repairs, tackling everything from leaks to spin cycle problems, restoring your laundry routine.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleLearnMore}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceBox}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={() => handleImagePress('Fridge')}>
            <Image
              source={require('../assets/images/fridgerepair.jpg')}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Fridge Repair</Text>
        <Text style={styles.description}>
          Our experts quickly diagnose and fix fridge issues, ensuring your food stays fresh with minimal downtime.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleLearnMore}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceBox}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={() => handleImagePress('Microwave')}>
            <Image
              source={require('../assets/images/microwave.jpg')}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Microwave Repair:</Text>
        <Text style={styles.description}>
          We fix Microwave malfunctions promptly, ensuring your appliance heats and cooks efficiently without hassle.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleLearnMore}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );    
};

export default ServicePage

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  serviceBox: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 30,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden', // Ensures the image respects the border radius
  },
  image: {
    width: '100%',
    height: 200,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  applicantItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  applicantName: {
    fontSize: 16,
    color: '#007bff',
  },
  noApplicantsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 15,
  },
  modalCloseButton: {
    marginTop: 15,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
  },
});