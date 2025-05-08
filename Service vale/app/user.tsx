import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Databases, ID, Query } from 'appwrite';
import { account, databases } from '../lib/appwrite';
import { useRouter } from 'expo-router';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = '681c429800281e8a99bd';

const cities = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad",
  "Chennai", "Kolkata", "Surat", "Pune", "Jaipur",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane",
  "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara"
];

type User = {
  $id: string;
  name: string;
  address: string;
  contactNo: string;
  aadharNo: string;
  panNo: string;
  city: string;
  category: string;
  $collectionId?: string;
  $databaseId?: string;
  $createdAt?: string;
  $updatedAt?: string;
  $permissions?: string[];
};

const UserDetailsForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNo: '',
    aadharNo: '',
    panNo: '',
    city: '',
    category: "",
  });
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState(cities);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [submittedUsers, setSubmittedUsers] = useState<User[]>([]);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const user = await account.get();
        console.log('Authenticated as:', user.email);
        
        const response = await databases.listDocuments(
          DATABASE_ID, 
          COLLECTION_ID
        );
        setSubmittedUsers(response.documents as unknown as User[]);
      } catch (error: unknown) {
        console.error('Error fetching users:', error);
        if (error instanceof Error && 'code' in error && error.code === 401) {
          Alert.alert(
            'Session Expired', 
            'Please log in again',
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
        }
      }
    };
    
    fetchUsers();
  }, []);

  const validateForm = () => {
    let valid = true;
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
      valid = false;
    }

    if (!formData.contactNo.trim()) {
      newErrors.contactNo = 'Contact number is required';
      valid = false;
    } else if (!/^[0-9]{10}$/.test(formData.contactNo)) {
      newErrors.contactNo = 'Invalid contact number (10 digits required)';
      valid = false;
    }

    if (!formData.aadharNo.trim()) {
      newErrors.aadharNo = 'Aadhar number is required';
      valid = false;
    } else if (!/^[0-9]{12}$/.test(formData.aadharNo)) {
      newErrors.aadharNo = 'Invalid Aadhar number (12 digits required)';
      valid = false;
    }

    if (!formData.panNo.trim()) {
      newErrors.panNo = 'PAN number is required';
      valid = false;
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNo)) {
      newErrors.panNo = 'Invalid PAN number (format: ABCDE1234F)';
      valid = false;
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
      valid = false;
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleCitySearch = (text:any) => {
    setSearchQuery(text);
    const filtered = cities.filter(city =>
      city.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCities(filtered);
  };

  const cleanDocumentData = (doc: any) => {
    const { $collectionId, $databaseId, $createdAt, $updatedAt, $permissions, ...cleanData } = doc;
    return cleanData;
  };

 // Update your handleSubmit function
const handleSubmit = async () => {
  if (validateForm()) {
    try {
      if (editingIndex !== null) {
        const updateData = {
          name: formData.name,
          address: formData.address,
          contactNo: formData.contactNo,
          aadharNo: formData.aadharNo,
          panNo: formData.panNo,
          city: formData.city,
          category: formData.category
        };

        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          submittedUsers[editingIndex].$id,
          updateData
        );
        
        const updatedUsers = [...submittedUsers];
        updatedUsers[editingIndex] = { 
          ...updatedUsers[editingIndex],
          ...updateData
        };
        setSubmittedUsers(updatedUsers);
        setEditingIndex(null);
      } else {
        const response = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          formData
        );
        setSubmittedUsers([...submittedUsers, response as unknown as User]);
      }
      
      Alert.alert('Success', 'User details saved successfully!');
      resetForm();
      setIsFormVisible(false);
    } catch (error: unknown) {
      console.error('Error saving user:', error);
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to save user details'
      );
    }
  }
};
  const handleChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDeleteUser = async (index: number) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this user?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const userId = submittedUsers[index].$id;
              
              // Delete from database first
              await databases.deleteDocument(
                DATABASE_ID,
                COLLECTION_ID,
                userId
              );
              
              // Then update local state
              setSubmittedUsers(prevUsers => 
                prevUsers.filter(user => user.$id !== userId)
              );
              
              // Reset form if editing the deleted user
              if (editingIndex === index) {
                setEditingIndex(null);
                resetForm();
              }
              
              // Close expanded view if open
              if (expandedItem === index) {
                setExpandedItem(null);
              }
              
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Error deleting user:', error);
            Alert.alert('Error', (error as Error).message || 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      contactNo: '',
      aadharNo: '',
      panNo: '',
      city: '',
      category: "",
    });
    setErrors({});
  };

  const openFormForNewUser = () => {
    resetForm();
    setIsFormVisible(true);
  };

  return (
    <View style={styles.mainContainer}>
      {/* Plus Icon Button */}
      <TouchableOpacity
        style={styles.plusButton}
        onPress={() => setIsFormVisible(true)}
      >
        <Ionicons name="add-circle" size={50} color="#3498db" />
      </TouchableOpacity>

      {/* Display Submitted Data */}
      <ScrollView style={styles.usersList}>
        {submittedUsers.map((user, index) => (
          <View key={user.$id} style={styles.collapsibleContainer}>
            <TouchableOpacity
              style={styles.nameItem}
              onPress={() => setExpandedItem(expandedItem === index ? null : index)}
            >
              <Text style={styles.nameText}>{user.name}</Text>
              <Ionicons
                name={expandedItem === index ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#3498db"
              />
            </TouchableOpacity>

            {expandedItem === index && (
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>{user.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{user.contactNo}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Aadhar:</Text>
                  <Text style={styles.detailValue}>{user.aadharNo}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>PAN:</Text>
                  <Text style={styles.detailValue}>{user.panNo}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City:</Text>
                  <Text style={styles.detailValue}>{user.city}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{user.category}</Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.actioneditButton}
                    onPress={() => {
                      setFormData(cleanDocumentData(user));
                      setEditingIndex(index);
                      setIsFormVisible(true);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteUser(index)}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Form Modal */}
      <Modal
        visible={isFormVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setIsFormVisible(false);
          setEditingIndex(null), resetForm();
        }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.modalHeader}>
            <Text style={styles.header}>User Details Form</Text>
            <TouchableOpacity onPress={() => setIsFormVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {/* All your form fields here... */}
          {/* Name Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person" size={20} color="#666" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="home" size={20} color="#666" style={styles.icon} />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter full address"
                value={formData.address}
                onChangeText={(text) => handleChange('address', text)}
                multiline
                numberOfLines={3}
              />
            </View>
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>

          {/* Contact Number Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Number</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="phone" size={20} color="#666" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit mobile number"
                value={formData.contactNo}
                onChangeText={(text) => handleChange('contactNo', text)}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            {errors.contactNo && <Text style={styles.errorText}>{errors.contactNo}</Text>}
          </View>

          {/* Aadhar Card Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Aadhar Card Number</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="credit-card" size={20} color="#666" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter 12-digit Aadhar number"
                value={formData.aadharNo}
                onChangeText={(text) => handleChange('aadharNo', text)}
                keyboardType="number-pad"
                maxLength={12}
              />
            </View>
            {errors.aadharNo && <Text style={styles.errorText}>{errors.aadharNo}</Text>}
          </View>

          {/* PAN Card Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>PAN Card Number</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="assignment" size={20} color="#666" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter PAN number (e.g., ABCDE1234F)"
                value={formData.panNo}
                onChangeText={(text) => handleChange('panNo', text.toUpperCase())}
                maxLength={10}
                autoCapitalize="characters"
              />
            </View>
            {errors.panNo && <Text style={styles.errorText}>{errors.panNo}</Text>}
          </View>

          {/* City Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>City</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="location-city" size={20} color="#666" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Search or select city"
                value={formData.city}
                onChangeText={(text) => {
                  handleChange('city', text);
                  handleCitySearch(text);
                }}
                onFocus={() => setShowCityDropdown(true)}
              />
              <TouchableOpacity
                onPress={() => setShowCityDropdown(!showCityDropdown)}
                style={styles.searchIcon}
              >
                <Feather name="search" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {showCityDropdown && (
              <View style={styles.dropdownContainer}>
                <ScrollView
                  style={styles.dropdownScroll}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => {
                          handleChange('city', city);
                          setShowCityDropdown(false);
                          setSearchQuery('');
                          setFilteredCities(cities);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{city}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noResults}>
                      <Text style={styles.noResultsText}>No cities found</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.inputWrapper}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(itemValue) => handleChange('category', itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select a category" value="" />
                <Picker.Item label="Service" value="Service" />
                <Picker.Item label="Repair" value="Repair" />
                <Picker.Item label="Technicion" value="Technicion" />
              </Picker>
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Details</Text>
          </TouchableOpacity>

          {/* Reset Button */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetForm}
          >
            <Text style={styles.resetButtonText}>Reset Form</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  usersList: {
    flex: 1,
  },
  plusButton: {
    alignSelf: 'center',
    marginVertical: 20,
  },
  collapsibleContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  nameItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsContainer: {
    padding: 15,
    paddingTop: 0,
  },
  submittedDataContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submittedHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  detailValue: {
    color: '#333',
  },
  editButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
    fontWeight: '500',
  },
  picker: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingVertical: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  searchIcon: {
    padding: 8,
  },
  dropdownContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 1000,
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  noResults: {
    padding: 12,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#888',
  },
// In your styles, replace the button-related styles with:
buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  actioneditButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3498db',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'red',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserDetailsForm;