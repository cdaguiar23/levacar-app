import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Button } from 'react-native';
import { supabase } from '../../src/services/supabaseConfig';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

function DriverHome() {
    const { user } = useAuth();
    const router = useRouter();
    const [pendingRides, setPendingRides] = useState<any[]>([]);
    const [myRides, setMyRides] = useState<any[]>([]);

    useEffect(() => {
        fetchPendingRides();
        fetchMyRides();

        // Subscribe to new rides
        const channel = supabase.channel('public:rides')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, (payload) => {
                fetchPendingRides();
                fetchMyRides();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchPendingRides = async () => {
        try {
            const { data, error } = await supabase
                .from('rides')
                .select(`*, mechanics(name, address)`)
                .eq('status', 'PENDING');

            if (error) throw error;
            setPendingRides(data || []);
        } catch (error) {
            console.log("Error fetching rides:", error);
        }
    };

    const fetchMyRides = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('rides')
                .select(`*, mechanics(name, address)`)
                .eq('driver_id', user.id)
                .neq('status', 'COMPLETED')
                .neq('status', 'CANCELED');

            if (error) throw error;
            setMyRides(data || []);
        } catch (error) {
            console.log("Error fetching my rides:", error);
        }
    };


    const acceptRide = async (rideId: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('rides')
                .update({ status: 'ACCEPTED', driver_id: user.id })
                .eq('id', rideId);

            if (error) throw error;
            Alert.alert('Sucesso', 'Você aceitou esta corrida!');
            fetchPendingRides();
            fetchMyRides();
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível aceitar a corrida.');
            console.log(e);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const updateStatus = async (rideId: string, newStatus: string) => {
        try {
            const { error } = await supabase.from('rides').update({ status: newStatus }).eq('id', rideId);
            if (error) throw error;
            fetchMyRides();
        } catch (e) {
            Alert.alert('Erro', 'Falha ao atualizar status');
        }
    };

    const renderRide = ({ item }: { item: any }) => (
        <View style={styles.rideCard}>
            <Text style={styles.serviceType}>Serviço: {item.service_type}</Text>
            <Text style={styles.mechanicName}>Oficina: {item.mechanics?.name}</Text>
            <Text style={styles.address}>Endereço: {item.pickup_address}</Text>

            {item.status === 'PENDING' ? (
                <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRide(item.id)}>
                    <Text style={styles.btnText}>Aceitar Corrida</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.statusActions}>
                    <Text style={styles.statusLabel}>Status Atual: {item.status}</Text>
                    <View style={styles.buttonsRow}>
                        {item.status === 'ACCEPTED' && <Button title="A Caminho" onPress={() => updateStatus(item.id, 'EN_ROUTE')} />}
                        {item.status === 'EN_ROUTE' && <Button title="Cheguei na Oficina" onPress={() => updateStatus(item.id, 'AT_MECHANIC')} />}
                        {(item.status === 'AT_MECHANIC' || item.status === 'ACCEPTED') && item.service_type === 'BUSCAR' && <Button title="Retornando" onPress={() => updateStatus(item.id, 'RETURNING')} />}
                        {(item.status === 'AT_MECHANIC' || item.status === 'RETURNING') && <Button title="Finalizar" color="green" onPress={() => updateStatus(item.id, 'COMPLETED')} />}
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Painel do Motorista</Text>

            {myRides.length > 0 && (
                <View>
                    <Text style={styles.subtitle}>Sua Corrida Atual:</Text>
                    <FlatList
                        data={myRides}
                        keyExtractor={(item) => item.id}
                        renderItem={renderRide}
                    />
                </View>
            )}

            {pendingRides.length > 0 && (
                <View style={{ flex: 1, marginTop: 10 }}>
                    <Text style={styles.subtitle}>Solitações Disponíveis:</Text>
                    <FlatList
                        data={pendingRides}
                        keyExtractor={(item) => item.id}
                        renderItem={renderRide}
                    />
                </View>
            )}

            {myRides.length === 0 && pendingRides.length === 0 && (
                <Text style={styles.emptyText}>Nenhuma solicitação no momento.</Text>
            )}

            <View style={styles.buttonContainer}>
                <Button title="Meu Perfil (CNH)" onPress={() => router.push('/driver/profile')} color="#007AFF" />
                <View style={{ marginTop: 10 }}>
                    <Button title="Sair" onPress={handleLogout} color="red" />
                </View>
            </View>
        </View>
    );
}

export default DriverHome;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5, marginTop: 40 },
    subtitle: { fontSize: 16, marginBottom: 10, color: '#666', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' },
    rideCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3
    },
    serviceType: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginBottom: 5 },
    mechanicName: { fontSize: 16, fontWeight: '600' },
    address: { fontSize: 14, color: '#555', marginBottom: 15 },
    acceptBtn: { backgroundColor: '#34C759', padding: 12, borderRadius: 8, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    buttonContainer: { marginTop: 'auto', width: '100%' },
    statusActions: { marginTop: 10, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
    statusLabel: { fontWeight: 'bold', marginBottom: 10, color: '#333' },
    buttonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }
});
