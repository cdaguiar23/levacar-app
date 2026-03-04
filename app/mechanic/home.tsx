import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Button, ActivityIndicator } from 'react-native';
import { supabase } from '../../src/services/supabaseConfig';
import { useAuth } from '../../src/context/AuthContext';

export default function MechanicHome() {
    const { user } = useAuth();
    const [mechanicData, setMechanicData] = useState<any>(null);
    const [incomingRides, setIncomingRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMechanicProfile();
    }, []);

    useEffect(() => {
        if (mechanicData) {
            fetchIncomingRides();

            const channel = supabase.channel('public:rides_mechanic')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, (payload) => {
                    fetchIncomingRides();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [mechanicData]);

    const fetchMechanicProfile = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('mechanics')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) setMechanicData(data);
        } catch (e) {
            console.log('Error fetching mechanic info', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchIncomingRides = async () => {
        if (!mechanicData) return;
        try {
            const { data, error } = await supabase
                .from('rides')
                .select(`*, users!client_id(name, phone)`)
                .eq('mechanic_id', mechanicData.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setIncomingRides(data || []);
        } catch (e) {
            console.log('Error fetching rides for mechanic', e);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    // Se o usuário tem role=MECHANIC mas ainda não criou a oficina no DB
    if (!mechanicData) {
        return (
            <View style={styles.center}>
                <Text>Cadastro da Oficina Incompleto.</Text>
                <Button title="Sair" onPress={handleLogout} />
            </View>
        );
    }

    const renderRide = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Text style={styles.header}>Serviço: {item.service_type}</Text>
            <Text style={styles.info}>Cliente: {item.users?.name || '---'}</Text>
            <Text style={styles.info}>Status: {item.status}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Oficina: {mechanicData.name}</Text>
            <Text style={styles.subtitle}>Gerencie os carros direcionados para cá</Text>

            {incomingRides.length === 0 ? (
                <Text style={styles.emptyText}>Sem históricos ou chamados atuais.</Text>
            ) : (
                <FlatList
                    data={incomingRides}
                    keyExtractor={item => item.id}
                    renderItem={renderRide}
                    style={{ marginTop: 10 }}
                />
            )}

            <View style={{ marginTop: 20 }}>
                <Button title="Sair" onPress={handleLogout} color="red" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, marginTop: 40 },
    subtitle: { fontSize: 16, color: '#555', marginBottom: 20 },
    emptyText: { textAlign: 'center', marginTop: 30, color: '#999' },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
    header: { fontSize: 16, fontWeight: 'bold', color: '#E65100', marginBottom: 5 },
    info: { fontSize: 14, color: '#333', marginBottom: 2 }
});
