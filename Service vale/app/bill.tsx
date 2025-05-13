import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, ScrollView, Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Databases, ID, Query } from 'appwrite';
import { databases } from '../lib/appwrite';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'bill_ID';

  const fieldLabels = {
  serviceType: 'Service Type',
  serviceBoyName: 'Service Provider Name',
  customerName: 'Customer Name',
  address: 'Address',
  contactNumber: 'Contact Number',
  serviceCharge: 'Service Charge (₹)'
};

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
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.orderDesc('date') // Show newest bills first
        ]
      );
      setBills(response.documents);
    } catch (error) {
      console.error('Error fetching bills:', error);
      Alert.alert('Error', 'Failed to fetch bills');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBillNumber = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BILL-${dateStr}-${randomStr}`;
  };

  const validateForm = () => {
    if (!form.serviceType.trim()) {
      Alert.alert('Error', 'Service type is required');
      return false;
    }
    if (!form.serviceBoyName.trim()) {
      Alert.alert('Error', 'Service provider name is required');
      return false;
    }
    if (!form.customerName.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return false;
    }
    if (!form.address.trim()) {
      Alert.alert('Error', 'Address is required');
      return false;
    }
    if (!form.contactNumber.trim() || !/^\d{10}$/.test(form.contactNumber)) {
      Alert.alert('Error', 'Valid 10-digit contact number is required');
      return false;
    }
    if (!form.serviceCharge.trim() || isNaN(parseFloat(form.serviceCharge))) {
      Alert.alert('Error', 'Valid service charge is required');
      return false;
    }
    if (paymentMethod === 'cash' && (!cashGiven.trim() || isNaN(parseFloat(cashGiven)))) {
      Alert.alert('Error', 'Valid cash amount is required');
      return false;
    }
    return true;
  };

const handleSubmitBill = async () => {
  if (!validateForm()) return;

  const billNumber = await generateBillNumber(); // Generate this first
  
  const billData = {
    ...form,
    paymentMethod,
    total: calculateTotal(),
    cashGiven: paymentMethod === 'cash' ? cashGiven : null,
    change: paymentMethod === 'cash' ? calculateChange() : null,
    date: new Date().toISOString(),
    billNumber, // Use the generated bill number
    status: 'paid',
    notes: notes.trim() || null
  };

  try {
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      billNumber, // Use billNumber as the document ID
      billData
    );
    
    Alert.alert('Success', 'Bill saved successfully!');
    fetchBills();
    setIsFormVisible(false);
    resetForm();
  } catch (error) {
    console.error('Error saving bill:', error);
    Alert.alert('Error', 'Failed to save bill');
  }
};

  const resetForm = () => {
    setForm({
      serviceType: '',
      serviceBoyName: '',
      customerName: '',
      address: '',
      contactNumber: '',
      serviceCharge: '',
    });
    setPaymentMethod('cash');
    setCashGiven('');
    setNotes('');
  };

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
        setIsFormVisible(true);
      } catch (error) {
        console.error('Error parsing service data:', error);
      }
    }
  }, [params.serviceData]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const charge = parseFloat(form.serviceCharge) || 0;
    return (charge).toFixed(2);
  };

  const calculateChange = () => {
    const total = parseFloat(calculateTotal()) || 0;
    const given = parseFloat(cashGiven) || 0;
    return given > total ? (given - total).toFixed(2) : '0.00';
  };

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
    if (!isFormVisible) {
      resetForm();
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Bill Summary</Text>

        {isFormVisible ? (
          <>
            {/* Service Details Section */}
            <Text style={styles.sectionTitle}>Service Details</Text>
            {Object.entries(form).map(([key, value]) => (
              <View key={key}>
                <Text style={styles.fieldLabel}>{fieldLabels[key as keyof typeof fieldLabels]}</Text>
                <TextInput
                  placeholder={`Enter ${fieldLabels[key as keyof typeof fieldLabels].toLowerCase()}`}
                  style={styles.input}
                  keyboardType={key === 'contactNumber' || key === 'serviceCharge' ? 'numeric' : 'default'}
                  value={value}
                  onChangeText={(text) => handleChange(key, text)}
                />
              </View>
            ))}

            {/* Notes Field */}
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              placeholder="Enter any additional notes (optional)"
              style={[styles.input, styles.multilineInput]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            {/* Charges Breakdown */}
            <View style={styles.chargesContainer}>
              <View style={styles.chargeRow}>
                <Text style={styles.chargeLabel}>Service Charge:</Text>
                <Text style={styles.chargeValue}>₹{form.serviceCharge || '0.00'}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
              </View>
            </View>

            {/* Payment Method Section */}
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

            {/* Payment Details */}
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
                <View style={styles.changeContainer}>
                  <Text style={styles.changeLabel}>Change to Return:</Text>
                  <Text style={styles.changeValue}>₹{calculateChange()}</Text>
                </View>
              </View>
            )}

            {paymentMethod === 'upi' && (
              <View style={styles.upiContainer}>
                <Text style={styles.sectionTitle}>Scan UPI QR Code</Text>
                <Image
                  source={require('../assets/images/payment.jpg')}
                  style={styles.qrCode}
                />
                <Text style={styles.upiId}>UPI ID: yourupi@bank</Text>
              </View>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitBill}>
              <Text style={styles.submitText}>Submit Bill</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.billsContainer}>
            <Text style={styles.sectionTitle}>Recent Bills</Text>
            
            {isLoading ? (
              <Text>Loading bills...</Text>
            ) : bills.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No bills created yet</Text>
                <Text style={styles.emptySubtext}>Tap the + button to create a new bill</Text>
              </View>
            ) : (
              bills.map((bill) => (
                <TouchableOpacity 
                  key={bill.$id} 
                  style={styles.billCard}
                >
                  <View style={styles.billHeader}>
                    <Text style={styles.billCustomer}>{bill.customerName}</Text>
                    <Text style={styles.billAmount}>₹{bill.total}</Text>
                  </View>
                  <View style={styles.billSubHeader}>
                    <Text style={styles.billNumber}>{bill.billNumber}</Text>
                    <Text style={[
                      styles.billStatus,
                      bill.status === 'paid' && styles.statusPaid,
                      bill.status === 'pending' && styles.statusPending,
                      bill.status === 'cancelled' && styles.statusCancelled
                    ]}>
                      {bill.status}
                    </Text>
                  </View>
                  {bill.notes && <Text style={styles.billNotes}>{bill.notes}</Text>}
                  <View style={styles.userFooter}>
                  <Text style={styles.billService}>{bill.serviceType} by {bill.serviceBoyName}</Text>
                  <Text style={styles.billDate}>
                    {new Date(bill.date).toLocaleDateString()}
                  </Text>
                </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={toggleFormVisibility}>
        <Ionicons name={isFormVisible ? 'close' : 'add'} size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  billsContainer: {
  flex: 1,
  marginTop: 20,
},
billCard: {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 15,
  marginBottom: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
billHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 5,
},
billCustomer: {
  fontSize: 16,
  fontWeight: 'bold',
},
billAmount: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#007bff',
},
billService: {
  fontSize: 14,
  color: '#555',
  marginBottom: 5,
},
billDate: {
  fontSize: 12,
  color: '#888',
},
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
    color: '#2c3e50',
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
    color: '#2c3e50',
  },
  chargesContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chargeLabel: {
    fontSize: 16,
    color: '#555',
  },
  chargeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007bff',
  },
  cashContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  changeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'green',
  },
  upiContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  qrCode: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    borderRadius: 10,
    marginVertical: 10,
  },
  upiId: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    color: '#555',
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
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  billSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  billNumber: {
    fontSize: 12,
    color: '#666',
  },
  billStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    textTransform: 'capitalize',
  },
  statusPaid: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  statusCancelled: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  billNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  fieldLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: '#2c3e50',
  marginBottom: 5,
  marginTop: 10,
  },
});

export default BillPage;




























