import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

    const handleLogin = () => {
        if (email === '' || password === '') {
            Alert.alert('Error', 'Please fill in all fields');
        } else if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email');
        } else if (!passwordRegex.test(password)) {
            Alert.alert('Error', 'Password must contain an uppercase letter, number, and special character');
        } else {
            // ✅ Check for "admin" in email to determine role
            const isAdmin = email.toLowerCase().includes('admin');
    
            if (isAdmin) {
                Alert.alert('Success', `Logged in as Admin (${email})`);
                router.replace('/home'); // 👈 navigate to admin dashboard
            } else {
                Alert.alert('Success', `Logged in as User (${email})`);
                router.replace('/userapp/home'); // 👈 navigate to user home
            }
    
            resetFields();
        }
    };
    

    const handleRegister = () => {
        if (!username || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
        } else if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email');
        } else if (!passwordRegex.test(password)) {
            Alert.alert('Error', 'Password must contain an uppercase letter, number, and special character');
        } else if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
        } else {
            Alert.alert('Success', `Account created for ${username}`);
            resetFields();
            setIsLogin(true);
        }
    };

    const handleForgotPassword = () => {
        setForgotModalVisible(true);
    };

    const handleSendOTP = () => {
        if (forgotEmail === '') {
            Alert.alert('Error', 'Please enter your email');
        } else if (!emailRegex.test(forgotEmail)) {
            Alert.alert('Error', 'Invalid email address');
        } else {
            Alert.alert('OTP Sent', `An OTP has been sent to ${forgotEmail}`);
            setForgotModalVisible(false);
            setResetModalVisible(true);
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
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.serviceText}>SERVICE</Text>
                    <Text style={styles.valeText}>VALE</Text>
                </View>

                {/* Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../assets/images/react-logo.png')}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>

                {/* Forgot Password Modal */}
                <Modal transparent animationType="slide" visible={forgotModalVisible}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.frameContainer}>
                            <Text style={styles.title}>Reset Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#aaa"
                                value={forgotEmail}
                                onChangeText={setForgotEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
                                <Text style={styles.buttonText}>Send OTP</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setForgotModalVisible(false)}>
                                <Text style={styles.linkText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Reset Password Modal */}
                <Modal transparent animationType="slide" visible={resetModalVisible}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.frameContainer}>
                            <Text style={styles.title}>Set New Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="New Password"
                                    placeholderTextColor="#aaa"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showNewPassword}
                                />
                                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                    <Ionicons
                                        name={showNewPassword ? 'eye' : 'eye-off'}
                                        size={24}
                                        color="#888"
                                    />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor="#aaa"
                                value={resetConfirmPassword}
                                onChangeText={setResetConfirmPassword}
                                secureTextEntry={true}
                            />
                            <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                                <Text style={styles.buttonText}>Submit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setResetModalVisible(false)}>
                                <Text style={styles.linkText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Login/Register Form */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

                    {!isLogin && (
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#000000"
                            value={username}
                            onChangeText={setUsername}
                        />
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#000000"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Password"
                            placeholderTextColor="#000000"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? 'eye' : 'eye-off'}
                                size={24}
                                color="#888"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm password for Register */}
                    {!isLogin && (
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#000000"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={true}
                        />
                    )}

                    {isLogin && (
                        <View style={styles.forgotPasswordContainer}>
                            <TouchableOpacity onPress={handleForgotPassword}>
                                <Text style={styles.linkText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={isLogin ? handleLogin : handleRegister}
                    >
                        <Text style={styles.buttonText}>
                            {isLogin ? 'Log In' : 'Register'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={() => {
                            setIsLogin(!isLogin);
                            resetFields();
                        }}
                    >
                        <Text style={styles.registerButtonText}>
                            {isLogin ? 'Create an Account' : 'Back to Login'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: '#FFA500',
    },
    header: {
        alignItems: 'center',
        marginTop: 50,
    },
    serviceText: {
        fontSize: 80,
        fontWeight: 'bold',
        color: '#00008B',
    },
    valeText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#00008B',
        marginTop: -8,
    },
    formContainer: {
        marginTop: 20,
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000000',
        alignSelf: 'center',
        marginBottom: 32,
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 50,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 50,
        paddingHorizontal: 16,
        backgroundColor: '#f9f9f9',
        marginBottom: 16,
    },
    passwordInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },
    button: {
        height: 50,
        backgroundColor: '#1e90ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        marginBottom: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
    linkText: {
        color: '#000000',
        textAlign: 'center',
        marginTop: 15,
        fontSize: 18,
    },
    registerButton: {
        height: 50,
        backgroundColor: '#32CD32',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        marginTop: 16,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    frameContainer: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
        width: '100%',
    },
    forgotPasswordContainer: {
        marginBottom: 25,
    },
    imageContainer: {
        marginTop: 30,
        marginBottom: 20,
        alignItems: 'center',
    },
    image: {
        width: 300,
        height: 200,
    },
});
