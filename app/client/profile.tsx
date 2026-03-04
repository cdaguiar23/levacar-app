import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../src/services/supabaseConfig';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ClientProfile() {
    const { user } = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('users')
                .select('name, phone')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (data) {
                setName(data.name || '');
                setPhone(data.phone || '');
            }
        } catch (e) {
            console.log('Erro ao carregar perfil', e);
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async () => {
        if (!user) return;
        if (!name.trim()) return Alert.alert('Erro', 'Nome é obrigatório');

        setSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ name, phone })
                .eq('id', user.id);

            if (error) throw error;
            Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
            router.back();
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar o perfil.');
            console.log(e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Meu Perfil</Text>

            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
            />

            <Text style={styles.label}>Telefone / WhatsApp</Text>
            <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
            />

            <View style={styles.buttonContainer}>
                <Button
                    title={saving ? "Salvando..." : "Salvar Perfil"}
                    onPress={saveProfile}
                    disabled={saving}
                />
                <View style={{ marginTop: 10 }}>
                    <Button title="Voltar" color="#888" onPress={() => router.back()} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, marginTop: 20 },
    label: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5, color: '#444' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9'
    },
    buttonContainer: { marginTop: 40 }
});
