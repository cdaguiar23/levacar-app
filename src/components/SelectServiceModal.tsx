import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';

interface SelectServiceModalProps {
    visible: boolean;
    mechanic: any;
    onClose: () => void;
    onRequest: (serviceType: string) => void;
}

export default function SelectServiceModal({ visible, mechanic, onClose, onRequest }: SelectServiceModalProps) {
    if (!mechanic) return null;

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.bottomSheet}>
                    <Text style={styles.title}>{mechanic.name}</Text>
                    <Text style={styles.subtitle}>{mechanic.address}</Text>

                    <Text style={styles.question}>De qual serviço você precisa?</Text>

                    <TouchableOpacity style={styles.optionBtn} onPress={() => onRequest('LEVAR')}>
                        <Text style={styles.optionText}>1. Quero que Levem meu carro até lá</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.optionBtn} onPress={() => onRequest('BUSCAR')}>
                        <Text style={styles.optionText}>2. Quero que Busquem meu carro lá</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.optionBtn} onPress={() => onRequest('LEVAR_E_BUSCAR')}>
                        <Text style={styles.optionText}>3. Quero os dois (Levar e Buscar)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheet: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    title: { fontSize: 22, fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
    question: { fontSize: 16, fontWeight: '600', marginBottom: 15 },
    optionBtn: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center'
    },
    optionText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    closeBtn: { marginTop: 10, padding: 15, alignItems: 'center' },
    closeText: { color: 'red', fontWeight: '600', fontSize: 16 }
});
