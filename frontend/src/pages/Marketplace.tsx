import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { ArrowLeftRight, Clock, User } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  owner_id: number;
}

export default function Marketplace() {
  const queryClient = useQueryClient();
  const [selectedSlots, setSelectedSlots] = useState<Record<number, number>>({});

  const { data: swappableSlots = [], isLoading: loadingSlots } = useQuery<Event[]>({
    queryKey: ['swappable-slots'],
    queryFn: async () => {
      const { data } = await api.get('/swap/swappable-slots');
      return data;
    },
  });

  const { data: myEvents = [] } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await api.get('/events');
      return data;
    },
  });

  const mySwappableSlots = myEvents.filter((e) => e.status === 'SWAPPABLE');

  const requestSwap = async (theirSlotId: number) => {
    const mySlotId = selectedSlots[theirSlotId];
    if (!mySlotId) {
      alert('Please select one of your swappable slots to offer');
      return;
    }

    try {
      await api.post('/swap/swap-request', {
        mySlotId,
        theirSlotId,
      });
      queryClient.invalidateQueries({ queryKey: ['swappable-slots'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      alert('Swap request sent successfully!');
      setSelectedSlots((prev) => {
        const newState = { ...prev };
        delete newState[theirSlotId];
        return newState;
      });
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to send swap request');
    }
  };

  if (loadingSlots) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
          Loading marketplace...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Marketplace</h1>
        <p className="mt-2 text-slate-600">
          Browse and request swaps with other users' available slots. Find the perfect match for your schedule.
        </p>
      </div>

      {mySwappableSlots.length === 0 && (
        <div className="bg-yellow-50/50 backdrop-blur-sm border border-yellow-200/50 rounded-lg p-6 shadow-lg shadow-yellow-500/5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-700" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">No Swappable Slots</h3>
              <p className="text-sm text-yellow-700">
                You need at least one swappable slot to request swaps. Head over to your Dashboard to make a slot swappable.
              </p>
            </div>
          </div>
        </div>
      )}

      {swappableSlots.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200/50 p-16 text-center">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-slate-50 rounded-2xl">
            <ArrowLeftRight className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">No slots available</h3>
          <p className="text-slate-600 max-w-sm mx-auto">
            There are currently no swappable slots from other users. Check back later or make your own slots swappable.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {swappableSlots.map((slot) => (
            <div
              key={slot.id}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Available from another user</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{slot.title}</h3>
                  <div className="flex items-center text-sm text-slate-600 mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(slot.start_time).toLocaleString()} →{' '}
                    {new Date(slot.end_time).toLocaleString()}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Offer one of your swappable slots:
                  </label>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedSlots[slot.id] || ''}
                      onChange={(e) =>
                        setSelectedSlots({
                          ...selectedSlots,
                          [slot.id]: Number(e.target.value),
                        })
                      }
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={mySwappableSlots.length === 0}
                    >
                      <option value="">Select a slot...</option>
                      {mySwappableSlots.map((mySlot) => (
                        <option key={mySlot.id} value={mySlot.id}>
                          {mySlot.title} ({new Date(mySlot.start_time).toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => requestSwap(slot.id)}
                      disabled={!selectedSlots[slot.id] || mySwappableSlots.length === 0}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowLeftRight className="w-4 h-4 mr-2" />
                      Request Swap
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
