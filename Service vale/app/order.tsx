import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type FormData = {
  serviceboyName: string;
  clientName: string;
  phoneNumber: string;
  address: string;
  billAmount: string;
};

const OrderScreen = () => {
  const { applicantName, serviceType } = useLocalSearchParams<{ applicantName: string; serviceType: string }>();
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    serviceboyName: applicantName,
    clientName: '',
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

    router.push({
      pathname: '/pending',
      params: {
        newService: JSON.stringify({
          serviceType,
          ...formData
        })
      }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>New Service Order</Text>
        <Text style={styles.headerSubtitle}>Fill in the details below</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Service Boy</Text>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>{formData.serviceboyName}</Text>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Service Type</Text>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>{serviceType}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Details</Text>
          <View style={styles.field}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.clientName}
              onChangeText={(text) => handleChange('clientName', text)}
              placeholder="Client name"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="10-digit mobile number"
                value={formData.phoneNumber}
                onChangeText={(text) => handleChange('phoneNumber', text)}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Service Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => handleChange('address', text)}
              placeholder="Full address with landmarks"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="attach-money" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                value={formData.billAmount}
                onChangeText={(text) => handleChange('billAmount', text)}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Create Service Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  readOnlyContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 14,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#374151',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  inputIcon: {
    marginLeft: 14,
  },
  inputWithIcon: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderScreen;