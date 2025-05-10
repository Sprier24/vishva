import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { account } from '../lib/appwrite';

const LoginScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetConfirmPassword, setResetConfirmPassword] = useState('');
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const resetFields = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        setForgotEmail('');
        setNewPassword('');
        setResetConfirmPassword('');
    };

    const handleLogin = async () => {
        if (email === '' || password === '') {
            Alert.alert('Error', 'Please fill in all fields');
        } else if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email');
        } else if (!passwordRegex.test(password)) {
            Alert.alert('Error', 'Password must contain an uppercase letter, number, and special character');
        } else {
            try {
                const session = await account.createEmailPasswordSession(email, password);
                console.log('Login Success:', session);
                const user = await account.get();
                console.log('Current user:', user);
                Alert.alert('Success', `Logged in as ${email}`);
                resetFields();
                router.replace('/home');
            } catch (error: any) {
                console.error('Login Error:', error);
                Alert.alert('Login Error', error?.message || 'An unknown error occurred');
            }
        }
    };

    const handleRegister = async () => {
        if (!username || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
        } else if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email');
        } else if (!passwordRegex.test(password)) {
            Alert.alert('Error', 'Password must contain an uppercase letter, number, and special character');
        } else if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
        } else {
            try {
                await account.create('unique()', email, password, username);
                Alert.alert('Success', 'Account created successfully. Please log in.');
                resetFields();
                setIsLogin(true);
            } catch (error) {
                Alert.alert('Registration Error', error instanceof Error ? error.message : 'An unknown error occurred');
            }
        }
    };  
    
    const handleForgotPassword = () => {
        setForgotModalVisible(true);
    };

    const handleSendOTP = async () => {
        if (forgotEmail === '') {
            Alert.alert('Error', 'Please enter your email');
        } else if (!emailRegex.test(forgotEmail)) {
            Alert.alert('Error', 'Invalid email address');
        } else {
            try {
                await account.createRecovery(forgotEmail, 'https://your-app.com/reset-password');
                Alert.alert('OTP Sent', `A recovery email has been sent to ${forgotEmail}`);
                setForgotModalVisible(false);
            } catch (error) {
                Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send recovery email');
            }
        }
    };

    const handleResetPassword = () => {
        if (!newPassword || !resetConfirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
        } else if (newPassword !== resetConfirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
        } else if (!passwordRegex.test(newPassword)) {
            Alert.alert('Error', 'Password must contain an uppercase letter, number, and special character');
        } else {
            Alert.alert('Success', 'Your password has been reset');
            resetFields();
            setResetModalVisible(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
        >
            <ScrollView 
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* Branding Header */}
                <View style={styles.brandContainer}>
                    <Image
                        source={require('../assets/images/logo.jpg')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Forgot Password Modal */}
                <Modal transparent animationType="fade" visible={forgotModalVisible}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Reset Password</Text>
                            <Text style={styles.modalSubtitle}>Enter your email to receive a recovery link</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Email address"
                                placeholderTextColor="#999"
                                value={forgotEmail}
                                onChangeText={setForgotEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <View style={styles.modalButtonGroup}>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.secondaryButton]}
                                    onPress={() => setForgotModalVisible(false)}
                                >
                                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.primaryButton]}
                                    onPress={handleSendOTP}
                                >
                                    <Text style={styles.primaryButtonText}>Send OTP</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Reset Password Modal */}
                <Modal transparent animationType="fade" visible={resetModalVisible}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Set New Password</Text>
                            
                            <View style={styles.passwordInputContainer}>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="New Password"
                                    placeholderTextColor="#999"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showNewPassword}
                                />
                                <TouchableOpacity 
                                    style={styles.eyeIcon}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Ionicons
                                        name={showNewPassword ? 'eye' : 'eye-off'}
                                        size={20}
                                        color="#888"
                                    />
                                </TouchableOpacity>
                            </View>
                            
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Confirm Password"
                                placeholderTextColor="#999"
                                value={resetConfirmPassword}
                                onChangeText={setResetConfirmPassword}
                                secureTextEntry={true}
                            />
                            
                            <View style={styles.modalButtonGroup}>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.secondaryButton]}
                                    onPress={() => setResetModalVisible(false)}
                                >
                                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.primaryButton]}
                                    onPress={handleResetPassword}
                                >
                                    <Text style={styles.primaryButtonText}>Update Password</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Auth Form */}
                <View style={styles.authCard}>
                    <Text style={styles.authTitle}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </Text>
                    {!isLogin && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Username</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your username"
                                placeholderTextColor="#999"
                                value={username}
                                onChangeText={setUsername}
                            />
                        </View>
                    )}
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                {/* Improved Password Input Section */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter your password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity 
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? 'eye' : 'eye-off'}
                                size={20}
                                color="#888"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                    
                    {!isLogin && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Confirm Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm your password"
                                placeholderTextColor="#999"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={true}
                            />
                        </View>
                    )}
                    
                    {isLogin && (
                        <TouchableOpacity 
                            style={styles.forgotPasswordButton}
                            onPress={handleForgotPassword}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                        style={styles.authButton}
                        onPress={isLogin ? handleLogin : handleRegister}
                    >
                        <Text style={styles.authButtonText}>
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.authFooter}>
                        <Text style={styles.authFooterText}>
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setIsLogin(!isLogin);
                                resetFields();
                            }}
                        >
                            <Text style={styles.authFooterLink}>
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor:'#FBFBFB',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    brandContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 32,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    brandName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    brandTagline: {
        fontSize: 14,
        color: '#64748B',
    },
    authCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    authTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1E293B',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        fontSize: 15,
        color: '#1E293B',
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        overflow: 'hidden', // Ensures child components respect border radius
    },
    eyeIcon: {
        padding: 12,
         justifyContent: 'center',
        alignItems: 'center'
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '500',
    },
    authButton: {
        height: 48,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    authButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    authFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    authFooterText: {
        fontSize: 14,
        color: '#64748B',
        marginRight: 4,
    },
    authFooterLink: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalInput: {
        height: 48,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        fontSize: 15,
        color: '#1E293B',
        marginBottom: 16,
    },
    modalButtonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        marginLeft: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryButton: {
        backgroundColor: '#F1F5F9',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
 
    passwordInput: {
        flex: 1,
        height: 48,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#1E293B',
    },
});

export default LoginScreen;