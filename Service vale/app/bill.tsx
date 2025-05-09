import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, ScrollView, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const BillPage = () => {

  const params = useLocalSearchParams();
  const [form, setForm] = useState({
    serviceType: '',
    serviceBoyName: '',
    customerName: '',
    address: '',
    contactNumber: '',
    serviceCharge: '',
  });

  useEffect(() => {
    if (params.serviceData) {
      try {
        const serviceData = JSON.parse(params.serviceData as string);
        setForm({
          serviceType: serviceData.serviceType || '',
          serviceBoyName: serviceData.serviceBoyName || '',
          customerName: serviceData.customerName || '',
          address: serviceData.address || '',
          contactNumber: serviceData.contactNumber || '',
          serviceCharge: serviceData.serviceCharge || '',
        });
        setIsFormVisible(true); // Automatically show the form when data is received
      } catch (error) {
        console.error('Error parsing service data:', error);
      }
    }
  }, [params.serviceData]);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false); // New state for form visibility

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Bill Details:", form);
    console.log("Payment Method:", paymentMethod);
    console.log("Cash Given:", cashGiven);
    setIsFormVisible(false); // Close form after submission
  };

  const calculateChange = () => {
    const charge = parseFloat(form.serviceCharge) || 0;
    const given = parseFloat(cashGiven) || 0;
    return given > charge ? (given - charge).toFixed(2) : '0.00';
  };

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Bill Summary</Text>

        {isFormVisible ? (
          <>
            {Object.entries(form).map(([key, value]) => (
              <TextInput
                key={key}
                placeholder={key.replace(/([A-Z])/g, ' $1')}
                style={styles.input}
                keyboardType={key === 'contactNumber' || key === 'serviceCharge' ? 'numeric' : 'default'}
                value={value}
                onChangeText={(text) => handleChange(key, text)}
              />
            ))}

            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.radioContainer}>
              <TouchableOpacity style={styles.radioOption} onPress={() => setPaymentMethod('cash')}>
                <View style={[styles.radioCircle, paymentMethod === 'cash' && styles.selected]} />
                <Text style={styles.radioText}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioOption} onPress={() => setPaymentMethod('upi')}>
                <View style={[styles.radioCircle, paymentMethod === 'upi' && styles.selected]} />
                <Text style={styles.radioText}>UPI</Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === 'cash' && (
              <View style={styles.cashContainer}>
                <Text style={styles.sectionTitle}>Cash Payment</Text>
                <TextInput
                  placeholder="Amount Given by Customer"
                  style={styles.input}
                  keyboardType="numeric"
                  value={cashGiven}
                  onChangeText={setCashGiven}
                />
                <Text style={styles.changeText}>
                  Change to Return: ₹ {calculateChange()}
                </Text>
              </View>
            )}

            {paymentMethod === 'upi' && (
              <View style={styles.upiContainer}>
                <Text style={styles.sectionTitle}>Scan UPI QR Code</Text>
                <Image
                  source={require('../assets/images/hello_qr.png')}
                  style={styles.qrCode}
                />
                <Text style={{ textAlign: 'center', marginTop: 10 }}>UPI ID: yourupi@bank</Text>
              </View>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitText}>Submit Bill</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No bills created yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create a new bill</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={toggleFormVisibility}
      >
        <Ionicons 
          name={isFormVisible ? 'close' : 'add'} 
          size={28} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f4f4f4',
    flexGrow: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 15,
  },
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007bff',
    marginRight: 8,
  },
  selected: {
    backgroundColor: '#007bff',
  },
  radioText: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cashContainer: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
  },
  changeText: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
    color: 'green',
  },
  upiContainer: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  qrCode: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007bff',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default BillPage;