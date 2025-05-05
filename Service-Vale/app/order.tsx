
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { OrderDetailsScreenRouteProp } from '../types/navigation';

type FormData = {
  clientName: string;
  phoneNumber: string;
  address: string;
  billAmount: string;
};

const OrderDetailsScreen = () => {
  const route = useRoute<OrderDetailsScreenRouteProp>();
  const { applicantName, serviceType } = route.params;
  
  const [formData, setFormData] = useState<FormData>({
    clientName: applicantName,
    phoneNumber: '',
    address: '',
    billAmount: ''
  });

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.clientName || !formData.phoneNumber) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    Alert.alert(
      'Order Created',
      `Service: ${serviceType}\nClient: ${formData.clientName}`,
      [{ text: 'OK' }]
    );
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create Service Order</Text>
      
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Service Type</Text>
        <Text style={styles.serviceType}>{serviceType}</Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Client Name</Text>
        <TextInput
          style={styles.input}
          value={formData.clientName}
          onChangeText={(text) => handleChange('clientName', text)}
          placeholder="Enter client name"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={formData.phoneNumber}
          onChangeText={(text) => handleChange('phoneNumber', text)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={formData.address}
          onChangeText={(text) => handleChange('address', text)}
          placeholder="Enter service address"
          multiline
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Bill Amount (₹)</Text>
        <TextInput
          style={styles.input}
          value={formData.billAmount}
          onChangeText={(text) => handleChange('billAmount', text)}
          placeholder="Enter amount"
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Create Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  serviceType: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OrderDetailsScreen;