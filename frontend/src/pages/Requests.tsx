import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Inbox, Send, Clock, User, CheckCircle, XCircle } from 'lucide-react';

interface SwapRequest {
  id: number;
  status: string;
  requester_name?: string;
  requester_email?: string;
  responder_name?: string;
  responder_email?: string;
  my_slot: {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
  };
  their_slot: {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
  };
}

interface RequestsData {
  incoming: SwapRequest[];
  outgoing: SwapRequest[];
}

export default function Requests() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<RequestsData>({
    queryKey: ['requests'],
    queryFn: async () => {
      const { data } = await api.get('/swap/requests');
      return data;
    },
    refetchInterval: 5000,
  });

  const respond = async (id: number, accept: boolean) => {
    try {
      await api.post(`/swap/swap-response/${id}`, { accept });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['swappable-slots'] });
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to respond to request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>;
      case 'ACCEPTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Accepted</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading requests...</div>
      </div>
    );
  }

  const incoming = data?.incoming || [];
  const outgoing = data?.outgoing || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Swap Requests</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your incoming and outgoing swap requests
        </p>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Inbox className="w-5 h-5 text-slate-700" />
          <h2 className="text-xl font-semibold text-slate-900">Incoming Requests</h2>
          {incoming.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {incoming.length}
            </span>
          )}
        </div>

        {incoming.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
            <Inbox className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No incoming requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incoming.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-900">
                      Request #{request.id}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <User className="w-4 h-4 mr-1" />
                    {request.requester_name} ({request.requester_email})
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Your slot</p>
                    <h4 className="font-semibold text-slate-900">{request.my_slot.title}</h4>
                    <div className="flex items-center text-sm text-slate-600 mt-1">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {new Date(request.my_slot.start_time).toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-blue-600 mb-2">Their slot (offered)</p>
                    <h4 className="font-semibold text-slate-900">{request.their_slot.title}</h4>
                    <div className="flex items-center text-sm text-slate-600 mt-1">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {new Date(request.their_slot.start_time).toLocaleString()}
                    </div>
                  </div>
                </div>

                {request.status === 'PENDING' && (
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => respond(request.id, false)}
                      className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                    <button
                      onClick={() => respond(request.id, true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Send className="w-5 h-5 text-slate-700" />
          <h2 className="text-xl font-semibold text-slate-900">Outgoing Requests</h2>
          {outgoing.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {outgoing.length}
            </span>
          )}
        </div>

        {outgoing.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
            <Send className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No outgoing requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {outgoing.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-900">
                      Request #{request.id}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <User className="w-4 h-4 mr-1" />
                    {request.responder_name} ({request.responder_email})
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Your slot (offered)</p>
                    <h4 className="font-semibold text-slate-900">{request.my_slot.title}</h4>
                    <div className="flex items-center text-sm text-slate-600 mt-1">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {new Date(request.my_slot.start_time).toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-blue-600 mb-2">Their slot (requested)</p>
                    <h4 className="font-semibold text-slate-900">{request.their_slot.title}</h4>
                    <div className="flex items-center text-sm text-slate-600 mt-1">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {new Date(request.their_slot.start_time).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
