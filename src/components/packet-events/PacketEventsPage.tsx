import React, { useState, useEffect } from 'react';
import { PacketEventsFilter } from './PacketEventsFilter';
import { packetEventsApi } from '../../api/endpoints/packet-events';
import { IEventRecord } from '../../types/packetevents';

const PacketEventsPage: React.FC = () => {
    const [data, setData] = useState<IEventRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async (filters = {}) => {
        setLoading(true);
        try {
            const result = await packetEventsApi.getAll(filters);
            setData(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    return (
        <div className="flex flex-col p-6 bg-[#F8FAFC] min-h-screen">
            <h1 className="text-[24px] font-bold text-[#1A1A1A] mb-8">
                Информация о пакетных событиях
            </h1>

            <PacketEventsFilter onSearch={loadData} />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#E5EEF5] text-[#4A5568] text-[11px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4 border-b">Событие</th>
                                <th className="px-6 py-4 border-b">Департамент</th>
                                <th className="px-6 py-4 border-b">Email</th>
                                <th className="px-6 py-4 border-b">Период с</th>
                                <th className="px-6 py-4 border-b">Период по</th>
                                <th className="px-6 py-4 border-b">Категория</th> 
                                <th className="px-6 py-4 border-b">Цена (KZT)</th>
                                <th className="px-6 py-4 border-b">Цена (USD)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-10">Загрузка...</td></tr>
                            ) : data.length > 0 ? (
                                data.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.event_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.department}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.period_from || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.period_to || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{item.payment_category || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.amount_kzt} ₸</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-500">
                                            {item.amount_usd ? `$${item.amount_usd}` : '—'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                [...Array(10)].map((_, i) => (
                                    <tr key={i} className="h-[52px] bg-white odd:bg-gray-50/30">
                                        {[...Array(8)].map((_, j) => <td key={j} className="px-6 py-4"></td>)}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PacketEventsPage;