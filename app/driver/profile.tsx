import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native';
import { supabase } from '../../src/services/supabaseConfig';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Buffer } from 'buffer';

export default function DriverProfile() {
    const { user } = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [cnhUrl, setCnhUrl] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (data) {
                setName(data.name || '');
                setPhone(data.phone || '');
                setCnhUrl(data.cnh_url || null);
            }
        } catch (e) {
            console.log('Erro ao carregar perfil', e);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
            base64: true
        });

        if (!result.canceled && result.assets[0].base64) {
            uploadCNH(result.assets[0].base64);
        }
    };

    const uploadCNH = async (base64Image: string) => {
        if (!user) return;
        setUploading(true);

        try {
            const filePath = `${user.id}/${Date.now()}_cnh.jpg`;
            const base64Str = base64Image;

            // Converter e fazer upload
            const { data, error } = await supabase.storage
                .from('cnh_images')
                .upload(filePath, Buffer.from(base64Str, 'base64'), {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            // Nota: o supabase-js no react-native tem uma forma peculiar de upload de base64 
            // Em produção real recomendamos FormData ou raw binary se o backend nao decodar o base64 direto, 
            // mas o supabase ja adicionou suporte a buffer local. 
            // Outro workaround é enviar a base64 string convertida usando o pacote buffer

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('cnh_images')
                .upload(filePath, Uint8Array.from(atob(base64Str), c => c.charCodeAt(0)), {
                    contentType: 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            // Pegar URL Pública
            const { data: publicUrlData } = supabase.storage
                .from('cnh_images')
                .getPublicUrl(filePath);

            setCnhUrl(publicUrlData.publicUrl);
            Alert.alert('Sucesso', 'CNH enviada! Lembre-se de salvar o perfil.');

        } catch (e: any) {
            Alert.alert('Erro de Upload', e.message || 'Falha ao enviar documento.');
            console.log(e);
        } finally {
            setUploading(false);
        }
    };

    const saveProfile = async () => {
        if (!user) return;
        if (!name.trim()) return Alert.alert('Erro', 'Nome é obrigatório');
        if (!cnhUrl) return Alert.alert('Aviso', 'Por favor, envie a foto da sua CNH.');

        setSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ name, phone, cnh_url: cnhUrl })
                .eq('id', user.id);

            if (error) throw error;
            Alert.alert('Sucesso', 'Perfil e CNH atualizados!');
            router.back();
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar o perfil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Cadastro de Motorista</Text>

            <Text style={styles.label}>Nome Completo</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Seu nome legível" />

            <Text style={styles.label}>Telefone / WhatsApp</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="(00) 00000-0000" />

            <Text style={styles.label}>Documento (CNH)</Text>

            <View style={styles.imageContainer}>
                {cnhUrl ? (
                    <Image source={{ uri: cnhUrl }} style={styles.cnhImage} />
                ) : (
                    <Text style={styles.imagePlaceholder}>Nenhuma CNH enviada ainda</Text>
                )}
            </View>

            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={uploading}>
                <Text style={styles.uploadText}>{uploading ? "Enviando..." : "Escolher Arquivo (Galeria)"}</Text>
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
                <Button title={saving ? "Salvando..." : "Salvar Cadastro"} onPress={saveProfile} disabled={saving} color="green" />
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
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
    label: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5, color: '#444' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
    buttonContainer: { marginTop: 20 },
    imageContainer: { height: 150, width: '100%', backgroundColor: '#eee', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' },
    cnhImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    imagePlaceholder: { color: '#888' },
    uploadBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
    uploadText: { color: 'white', fontWeight: 'bold' }
});
