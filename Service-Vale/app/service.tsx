import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';

const ServicePage = () => {
  const handleLearnMore = () => {
    Alert.alert('Learn More', 'Here you can navigate to detailed service info.');
    // Or use navigation.navigate('ServiceDetails') if using React Navigation
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.serviceBox}>
        <Image
          source={require('../assets/images/fridgerepair.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.title}>Fridge Repair</Text>
        <Text style={styles.description}>
        Our experts quickly diagnose and fix fridge issues, ensuring your food stays fresh with minimal downtime.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => handleLearnMore('Basic Service')}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceBox}>
        <Image
          source={require('../assets/images/washingmachine.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.title}>Washing Machine Repair:</Text>
        <Text style={styles.description}>
        We provide efficient washing machine repairs, tackling everything from leaks to spin cycle problems, restoring your laundry routine.        </Text>
        <TouchableOpacity style={styles.button} onPress={() => handleLearnMore('Basic Service')}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceBox}>
        <Image
          source={require('../assets/images/tv.jpeg')}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.title}>TV Repair</Text>
        <Text style={styles.description}>
        Our skilled technicians handle all TV issues, from screen problems to sound defects, for a seamless viewing experience.</Text>
        <TouchableOpacity style={styles.button} onPress={() => handleLearnMore('Basic Service')}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceBox}>
        <Image
          source={require('../assets/images/ac.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.title}>A.C Repair And Services:</Text>
        <Text style={styles.description}>
        Expert A.C repair and maintenance services to keep your cooling system efficient. Fast, reliable, and professional solutions for optimal comfort.</Text>
        <TouchableOpacity style={styles.button} onPress={() => handleLearnMore('Basic Service')}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceBox}>
        <Image
          source={require('../assets/images/ro.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.title}>R.O Repair Services:</Text>
        <Text style={styles.description}>
        Efficient R.O system repairs and maintenance to ensure pure, clean water. Quick service, expert technicians, and reliable solutions for your needs.</Text>
        <TouchableOpacity style={styles.button} onPress={() => handleLearnMore('Basic Service')}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceBox}>
        <Image
          source={require('../assets/images/deepfreezer.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.title}>Deep Freezer Repair Services:</Text>
        <Text style={styles.description}>
        Reliable repair services for deep freezers, ensuring efficient operation and preventing spoilage. Fast, expert repairs to keep your freezer running smoothly.</Text>
        <TouchableOpacity style={styles.button} onPress={() => handleLearnMore('Basic Service')}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceBox}>
        <Image
          source={require('../assets/images/microwave.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.title}>Microwave Repair:</Text>
        <Text style={styles.description}>
        We fix microwave malfunctions promptly, ensuring your appliance heats and cooks efficiently without hassle.</Text>
        <TouchableOpacity style={styles.button} onPress={() => handleLearnMore('Basic Service')}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceBox}>
        <Image
          source={require('../assets/images/emergency.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.title}>Emergency Repairs:</Text>
        <Text style={styles.description}>
        We offer emergency repair services to address urgent appliance breakdowns, minimizing inconvenience and restoring functionality quickly.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => handleLearnMore('Basic Service')}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.serviceBox}>
        <Image
          source={require('../assets/images/installation.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.title}>Installation Services:</Text>
        <Text style={styles.description}>
        Our professional installation services ensure your new appliances are set up correctly and ready to use without any issues.</Text>
        <TouchableOpacity style={styles.button} onPress={() => handleLearnMore('Basic Service')}>
          <Text style={styles.buttonText}>Learn More</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );    
};

export default ServicePage;

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
    image: {
      width: '100%',
      height: 200,
      borderRadius: 10,
      marginBottom: 15,
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
  });