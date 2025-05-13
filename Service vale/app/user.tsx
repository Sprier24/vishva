import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, ScrollView, Alert, Modal
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
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
  $createdAt?: string;
  email: string;
};

const fieldLabels = {
  name: 'Full Name',
  address: 'Address',
  contactNo: 'Contact Number',
  email: 'Email Address',
  aadharNo: 'Aadhar Number',
  panNo: 'PAN Number',
  city: 'City',
  category: 'Category'
};

const UserDetailsForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNo: '',
    email: '',
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailVisible, setIsUserDetailVisible] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const user = await account.get();
      console.log('Authenticated as:', user.email);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
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
    } finally {
      setIsLoading(false);
    }
  };

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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
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

  const handleCitySearch = (text: string) => {
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

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        if (editingIndex !== null) {
          const updateData = {
            name: formData.name,
            address: formData.address,
            contactNo: formData.contactNo,
            email: formData.email,
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
          setSubmittedUsers(prevUsers => [response as unknown as User, ...prevUsers]);
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
              await databases.deleteDocument(
                DATABASE_ID,
                COLLECTION_ID,
                userId
              );

              setSubmittedUsers(prevUsers =>
                prevUsers.filter(user => user.$id !== userId)
              );

              if (editingIndex === index) {
                setEditingIndex(null);
                resetForm();
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
      email: '',
      aadharNo: '',
      panNo: '',
      city: '',
      category: "",
    });
    setErrors({});
  };

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
    if (!isFormVisible) {
      resetForm();
      setEditingIndex(null);
    }
  };

  const showUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailVisible(true);
  };

  const closeUserDetails = () => {
    setIsUserDetailVisible(false);
    setSelectedUser(null);
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>User Management</Text>

        {isFormVisible ? (
          <>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>
                {editingIndex !== null ? 'Edit User' : 'Add New User'}
              </Text>
            </View>

            {Object.entries(formData).map(([key, value]) => {
              const currentValue = value || '';
              const label = fieldLabels[key as keyof typeof fieldLabels] || key;

              return (
                <View key={key}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  {key === 'category' ? (
                    <View style={styles.inputWrapper}>
                      <Picker
                        selectedValue={currentValue}
                        onValueChange={(itemValue) => handleChange(key, itemValue)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select a category" value="" />
                        <Picker.Item label="Service" value="Service" />
                        <Picker.Item label="Repair" value="Repair" />
                        <Picker.Item label="Technician" value="Technician" />
                      </Picker>
                    </View>
                  ) : key === 'city' ? (
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="location-city" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={`Enter ${label.toLowerCase()}`}
                        style={styles.input}
                        value={currentValue}
                        onChangeText={(text) => {
                          handleChange(key, text);
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
                  ) : (
                    <View style={styles.inputWrapper}>
                      {key === 'name' && <MaterialIcons name="person" size={20} color="#666" style={styles.icon} />}
                      {key === 'address' && <MaterialIcons name="home" size={20} color="#666" style={styles.icon} />}
                      {key === 'contactNo' && <MaterialIcons name="phone" size={20} color="#666" style={styles.icon} />}
                      {key === 'email' && <MaterialIcons name="email" size={20} color="#666" style={styles.icon} />}
                      {key === 'aadharNo' && <MaterialIcons name="credit-card" size={20} color="#666" style={styles.icon} />}
                      {key === 'panNo' && <MaterialIcons name="assignment" size={20} color="#666" style={styles.icon} />}
                      
                      <TextInput
                        placeholder={`Enter ${label.toLowerCase()}`}
                        style={key === 'address' ? [styles.input, styles.multilineInput] : styles.input}
                        value={currentValue}
                        onChangeText={(text) => handleChange(key, text)}
                        keyboardType={
                          key === 'contactNo' || key === 'aadharNo' ? 'numeric' : 
                          key === 'email' ? 'email-address' : 'default'
                        }
                        multiline={key === 'address'}
                        numberOfLines={key === 'address' ? 3 : 1}
                        maxLength={key === 'panNo' ? 10 : key === 'aadharNo' ? 12 : key === 'contactNo' ? 10 : undefined}
                        autoCapitalize={key === 'panNo' ? 'characters' : 'words'}
                      />
                    </View>
                  )}
                  {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
                  
                  {key === 'city' && showCityDropdown && (
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
                </View>
              );
            })}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.resetButton]}
                onPress={resetForm}
              >
                <Text style={styles.actionButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.actionButtonText}>
                  {editingIndex !== null ? 'Update User' : 'Add User'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.usersContainer}>
            <Text style={styles.sectionTitle}>User List</Text>
            
            {isLoading ? (
              <Text>Loading users...</Text>
            ) : submittedUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No users added yet</Text>
                <Text style={styles.emptySubtext}>Tap the + button to add a new user</Text>
              </View>
            ) : (
              submittedUsers.map((user, index) => (
                <TouchableOpacity 
                  key={user.$id} 
                  style={styles.userCard}
                  onPress={() => showUserDetails(user)}
                >
                  <View style={styles.userHeader}>
                    <Text style={styles.userName}>{user.name}</Text>
                  </View>
                  <Text style={styles.userContact}>{user.contactNo}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <View style={styles.userFooter}>
                    <Text style={styles.userCategory}>{user.category}</Text>
                    <Text style={styles.userDate}>
                      {new Date(user.$createdAt || '').toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* User Detail Modal */}
      <Modal
        visible={isUserDetailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeUserDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>User Details</Text>
                  <TouchableOpacity onPress={closeUserDetails}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalContent}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>{selectedUser.name}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedUser.email}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact:</Text>
                    <Text style={styles.detailValue}>{selectedUser.contactNo}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Aadhar:</Text>
                    <Text style={styles.detailValue}>{selectedUser.aadharNo}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PAN:</Text>
                    <Text style={styles.detailValue}>{selectedUser.panNo}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>{selectedUser.address}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City:</Text>
                    <Text style={styles.detailValue}>{selectedUser.city}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category:</Text>
                    <Text style={styles.detailValue}>{selectedUser.category}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created At:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedUser.$createdAt || '').toLocaleString()}
                    </Text>
                  </View>
                </ScrollView>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => {
                      setFormData(cleanDocumentData(selectedUser));
                      const index = submittedUsers.findIndex(u => u.$id === selectedUser.$id);
                      if (index !== -1) {
                        setEditingIndex(index);
                      }
                      setIsFormVisible(true);
                      closeUserDetails();
                    }}
                  >
                    <Text style={styles.editButtonText}>Edit User</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      handleDeleteUser(submittedUsers.findIndex(u => u.$id === selectedUser.$id));
                      closeUserDetails();
                    }}
                  >
                    <Text style={styles.editButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={toggleFormVisibility}>
        <Ionicons name={isFormVisible ? 'close' : 'add'} size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f4f4f4',
  },
  container: {
    padding: 20,
    paddingBottom: 80,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 15,
    color: '#2c3e50',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
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
  picker: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  searchIcon: {
    padding: 10,
  },
  dropdownContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: -10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 1000,
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#007bff',
  },
  resetButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  usersContainer: {
    flex: 1,
    marginTop: 10,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userActions: {
    flexDirection: 'row',
  },
  userContact: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  userCategory: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
  },
  userDate: {
    fontSize: 12,
    color: '#888',
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalContent: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 100,
    color: '#555',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
  modalFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default UserDetailsForm;