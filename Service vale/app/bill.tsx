import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, ScrollView, Image
} from 'react-native';

const BillPage = () => {
  const [form, setForm] = useState({
    serviceType: '',
    serviceBoyName: '',
    customerName: '',
    address: '',
    contactNumber: '',
    serviceCharge: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Bill Details:", form);
    console.log("Payment Method:", paymentMethod);
    console.log("Cash Given:", cashGiven);
  };

  const calculateChange = () => {
    const charge = parseFloat(form.serviceCharge) || 0;
    const given = parseFloat(cashGiven) || 0;
    return given > charge ? (given - charge).toFixed(2) : '0.00';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Bill Summary</Text>

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
});

export default BillPage;
