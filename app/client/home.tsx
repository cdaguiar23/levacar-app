import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../src/services/supabaseConfig';
import { useAuth } from '../../src/context/AuthContext';
import SelectServiceModal from '../../src/components/SelectServiceModal';
import { useRouter } from 'expo-router';

function ClientHome() {
    const { user } = useAuth();
    const router = useRouter();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [mechanics, setMechanics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedMechanic, setSelectedMechanic] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [currentRide, setCurrentRide] = useState<any>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos da sua localização para buscar os motoristas e oficinas.');
                setLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            fetchMechanics();
            fetchCurrentRide();

            const channel = supabase.channel('public:rides_client')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, (payload) => {
                    fetchCurrentRide();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        })();
    }, []);

    const fetchMechanics = async () => {
        try {
            const { data, error } = await supabase.from('mechanics').select('*').eq('is_active', true);
            if (error) throw error;
            setMechanics(data || []);
        } catch (e: any) {
            console.log('Error fetching mechanics', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentRide = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('rides')
                .select('*, driver:users!driver_id(name, phone)')
                .eq('client_id', user.id)
                .neq('status', 'COMPLETED')
                .neq('status', 'CANCELED')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) setCurrentRide(data);
            else setCurrentRide(null);
        } catch (e: any) {
            // Code PGRST116 means no rows found, which is fine
            if (e.code !== 'PGRST116') {
                console.log('Error fetching current ride', e);
            } else {
                setCurrentRide(null);
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const createRide = async (serviceType: string) => {
        if (!user || !selectedMechanic || !location) return;

        try {
            const { error } = await supabase.from('rides').insert([{
                client_id: user.id,
                mechanic_id: selectedMechanic.id,
                service_type: serviceType,
                pickup_address: "Buscando localização...",
                pickup_lat: location.coords.latitude,
                pickup_lng: location.coords.longitude,
            }]);

            if (error) throw error;
            Alert.alert("Sucesso", "Corrida Solicitada! Aguardando Motorista.");
            setModalVisible(false);
            fetchCurrentRide();
        } catch (e: any) {
            Alert.alert("Erro", "Falha ao solicitar corrida.");
        }
    };

    const cancelRide = async () => {
        if (!currentRide) return;
        try {
            await supabase.from('rides').update({ status: 'CANCELED' }).eq('id', currentRide.id);
            setCurrentRide(null);
            fetchCurrentRide();
        } catch (e) {
            Alert.alert("Erro", "Não foi possível cancelar a corrida.");
        }
    };

    if (loading || !location) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
            >
                {mechanics.map((mech) => (
                    <Marker
                        key={mech.id}
                        coordinate={{ latitude: mech.latitude, longitude: mech.longitude }}
                        title={mech.name}
                        description={mech.address}
                        pinColor="blue"
                        onPress={() => {
                            if (!currentRide) {
                                setSelectedMechanic(mech);
                                setModalVisible(true);
                            } else {
                                Alert.alert("Aviso", "Você já possui uma corrida em andamento.");
                            }
                        }}
                    />
                ))}
            </MapView>

            <SelectServiceModal
                visible={modalVisible}
                mechanic={selectedMechanic}
                onClose={() => setModalVisible(false)}
                onRequest={createRide}
            />

            <View style={styles.bottomSheet}>

                {currentRide ? (
                    <View>
                        <Text style={styles.title}>Status da Corrida</Text>
                        <Text style={styles.rideStatusText}>
                            {currentRide.status === 'PENDING' && "Buscando motoristas próximos..."}
                            {currentRide.status === 'ACCEPTED' && "Motorista a caminho para buscar seu carro!"}
                            {currentRide.status === 'EN_ROUTE' && "Seu carro está indo para a oficina."}
                            {currentRide.status === 'AT_MECHANIC' && "Status: Carro na oficina / manutenção."}
                            {currentRide.status === 'RETURNING' && "Motorista voltando para entregar seu carro!"}
                        </Text>

                        {currentRide.driver && (
                            <Text style={styles.driverInfo}>Motorista: {currentRide.driver.name}</Text>
                        )}

                        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: 'orange', marginTop: 10 }]} onPress={cancelRide}>
                            <Text style={styles.logoutText}>Cancelar Solicitação</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <Text style={styles.title}>Oficinas Próximas</Text>
                        {mechanics.length === 0 ? (
                            <Text style={styles.subtitle}>Nenhuma oficina encontrada na sua região.</Text>
                        ) : (
                            <Text style={styles.subtitle}>Clique no mapa para ver as oficinas!</Text>
                        )}
                    </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <TouchableOpacity style={[styles.logoutButton, { flex: 1, marginRight: 10, backgroundColor: '#007AFF' }]} onPress={() => router.push('/client/profile')}>
                        <Text style={styles.logoutText}>Meu Perfil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.logoutButton, { flex: 1 }]} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Sair</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

export default ClientHome;

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    map: { width: '100%', height: '65%' },
    bottomSheet: {
        height: '35%',
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
        marginTop: -20,
        justifyContent: 'space-between'
    },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
    rideStatusText: { fontSize: 16, color: '#E65100', fontWeight: 'bold', marginBottom: 5 },
    driverInfo: { fontSize: 14, color: '#333', marginBottom: 10 },
    logoutButton: {
        backgroundColor: '#ff4444',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
