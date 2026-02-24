import React, { useState, useEffect } from 'react';
import { IEventRecord } from '../../types/packetevents'; 
import { packetEventsApi } from '../../api/endpoints/packet-events';
import { CustomButton } from '../../ui/CustomButton';

const PacketEventsPage: React.FC = () => {
    const [data, setData] = useState<IEventRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await packetEventsApi.getAll();
                setData(result);
            } catch (error) {
                console.error("Failed to fetch packet events:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Чтение файлов (Packet Events)</h1>
                <CustomButton onClick={() => alert('Add modal soon!')}>Добавить запись</CustomButton>
            </div>

            {loading ? (
                <p>Загрузка...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-blue-50">
                                <th className="border p-2">Event Name</th>
                                <th className="border p-2">Department</th>
                                <th className="border p-2">Email</th>
                                <th className="border p-2">Сумма (KZT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="border p-2">{item.event_name}</td>
                                    <td className="border p-2">{item.department}</td>
                                    <td className="border p-2">{item.email}</td>
                                    <td className="border p-2">{item.amount_kzt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PacketEventsPage;