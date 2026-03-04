import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { supabase } from '../../src/services/supabaseConfig';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'CLIENT' | 'DRIVER'>('CLIENT');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha e-mail e senha.');
            return;
        }

        if (isSignUp && !name) {
            Alert.alert('Erro', 'Por favor, preencha o seu nome.');
            return;
        }

        setLoading(true);
        try {
            if (isSignUp) {
                // Registrar novo usuário
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;

                // Se o registro foi bem sucedido, criar o perfil na tabela users
                if (data.user) {
                    const { error: profileError } = await supabase
                        .from('users')
                        .insert([{ id: data.user.id, name, role, email }]);

                    if (profileError) throw profileError;

                    Alert.alert('Sucesso', 'Conta criada com sucesso! Você já pode entrar.');
                    setIsSignUp(false);
                }
            } else {
                // Login tradicional
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
            }
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Falha na autenticação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>LevaCar</Text>
                    <Text style={styles.subtitle}>
                        {isSignUp ? 'Crie sua conta agora' : 'Seja bem-vindo de volta'}
                    </Text>

                    {isSignUp && (
                        <>
                            <Text style={styles.label}>Nome Completo</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Seu nome"
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={styles.label}>Eu sou:</Text>
                            <View style={styles.roleContainer}>
                                <TouchableOpacity
                                    style={[styles.roleBtn, role === 'CLIENT' && styles.roleBtnActive]}
                                    onPress={() => setRole('CLIENT')}
                                >
                                    <Text style={[styles.roleText, role === 'CLIENT' && styles.roleTextActive]}>Cliente</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleBtn, role === 'DRIVER' && styles.roleBtnActive]}
                                    onPress={() => setRole('DRIVER')}
                                >
                                    <Text style={[styles.roleText, role === 'DRIVER' && styles.roleTextActive]}>Motorista</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    <Text style={styles.label}>E-mail</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="exemplo@email.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text style={styles.label}>Senha</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="********"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.mainBtn, loading && styles.mainBtnDisabled]}
                        onPress={handleAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.mainBtnText}>
                                {isSignUp ? 'Cadastrar' : 'Entrar'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.toggleBtn}
                        onPress={() => setIsSignUp(!isSignUp)}
                    >
                        <Text style={styles.toggleText}>
                            {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem conta? Cadastre-se'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    logo: {
        width: 150,
        height: 150,
        alignSelf: 'center',
        marginBottom: 10,
    },
    title: { fontSize: 36, fontWeight: 'bold', color: '#007AFF', textAlign: 'center', marginBottom: 5 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 15 },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
    },
    mainBtn: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 30,
    },
    mainBtnDisabled: { opacity: 0.7 },
    mainBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    toggleBtn: { marginTop: 20, alignItems: 'center' },
    toggleText: { color: '#007AFF', fontWeight: '600' },
    roleContainer: { flexDirection: 'row', gap: 10, marginVertical: 5 },
    roleBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#007AFF',
        alignItems: 'center',
    },
    roleBtnActive: { backgroundColor: '#007AFF' },
    roleText: { color: '#007AFF', fontWeight: 'bold' },
    roleTextActive: { color: 'white' }
});
