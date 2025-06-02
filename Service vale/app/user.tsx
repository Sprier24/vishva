import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { ID, Query } from 'appwrite';
import { account, databases } from '../lib/appwrite';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../constants/UserDetailsForm.styles';

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
  $createdAt?: string;
  email: string;
};

const fieldLabels = {
  name: 'Engineer Name',
  contactNo: 'Contact Number',
  email: 'Email Address',
  address: 'Address',
  panNo: 'PAN Number',
  aadharNo: 'Aadhar Number',
  city: 'City',
};

const UserDetailsForm = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNo: '',
    email: '',
    aadharNo: '',
    panNo: '',
    city: '',
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
      console.error('Error fetching engineers:', error);
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
      newErrors.name = 'Engineer Name is required';
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
      newErrors.email = 'Email Address is required';
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
        Alert.alert('Success', 'Engineer details saved successfully!');
        resetForm();
        setIsFormVisible(false);
      } catch (error: unknown) {
        console.error('Error saving engineer:', error);
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Failed to save engineer details'
        );
      }
    }
  };

  const handleChange = (name: string, value: string) => {
    if (name === 'panNo') {
      value = value.toUpperCase();
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDeleteUser = async (index: number) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this engineer?",
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
              Alert.alert('Success', 'Engineer deleted successfully');
            } catch (error) {
              console.error('Error deleting engineer:', error);
              Alert.alert('Error', (error as Error).message || 'Failed to delete engineer');
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5E72E4" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Engineer Management</Text>
        </View>
        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{submittedUsers.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 100 }]}>
        {isFormVisible ? (
          <>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>
                {editingIndex !== null ? 'Update Engineer' : 'Create Engineer'}
              </Text>
            </View>
            {Object.entries(formData).map(([key, value]) => {
              const currentValue = value || '';
              const label = fieldLabels[key as keyof typeof fieldLabels] || key;
              return (
                <View key={key}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  {key === 'city' ? (
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
                      {key === 'contactNo' && <MaterialIcons name="phone" size={20} color="#666" style={styles.icon} />}
                      {key === 'email' && <MaterialIcons name="email" size={20} color="#666" style={styles.icon} />}
                      {key === 'address' && <MaterialIcons name="home" size={20} color="#666" style={styles.icon} />}
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
                <Text style={styles.actionButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.actionButtonText}>
                  {editingIndex !== null ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.usersContainer}>
            {submittedUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="engineering" size={48} color="#A0AEC0" />
                <Text style={styles.emptyText}>No engineers added yet</Text>
                <Text style={styles.emptySubtext}>Tap the + button to add a new engineer</Text>
              </View>
            ) : (
              submittedUsers.map((user, index) => (
                <TouchableOpacity
                  key={user.$id}
                  style={styles.userCard}
                  onPress={() => showUserDetails(user)}
                >
                  <View style={styles.userHeader}>
                    <View style={styles.userAvatar}>
                      <MaterialIcons name="engineering" size={24} color="#5E72E4" />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userContact}>{user.contactNo}</Text>
                    </View>
                  </View>
                  <View style={styles.userFooter}>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userDate}>{new Date(user.$createdAt || '').toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

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
                  <Text style={styles.modalTitle}>Engineer Details</Text>
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
                    <Text style={styles.detailLabel}>Contact Number:</Text>
                    <Text style={styles.detailValue}>{selectedUser.contactNo}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email Address:</Text>
                    <Text style={styles.detailValue}>{selectedUser.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>{selectedUser.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Aadhar Number:</Text>
                    <Text style={styles.detailValue}>{selectedUser.aadharNo}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PAN:</Text>
                    <Text style={styles.detailValue}>{selectedUser.panNo}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City:</Text>
                    <Text style={styles.detailValue}>{selectedUser.city}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created At:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedUser.$createdAt || '').toLocaleString()}
                    </Text>
                  </View>
                </ScrollView>
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.editButton]}
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
                    <Text style={styles.modalButtonText}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={() => {
                      handleDeleteUser(submittedUsers.findIndex(u => u.$id === selectedUser.$id));
                      closeUserDetails();
                    }}
                  >
                    <Text style={styles.modalButtonText}>Delete</Text>
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
    </SafeAreaView>
  );
};

export default UserDetailsForm;