import { useState, FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  owner_id: number;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    start_time: '',
    end_time: '',
    status: 'BUSY',
  });
  const [errorMsg, setErrorMsg] = useState('');

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await api.get('/events');
      return data;
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Basic client-side validation
    if (!form.title || !form.start_time || !form.end_time) {
      setErrorMsg('Please fill all required fields: title, start and end time.');
      return;
    }

    const start = new Date(form.start_time);
    const end = new Date(form.end_time);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setErrorMsg('Invalid date format. Please enter valid start and end times.');
      return;
    }

    if (start >= end) {
      setErrorMsg('Start time must be before end time.');
      return;
    }

    // optional duration check (matches backend min/max defaults)
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    if (durationMinutes < 15) {
      setErrorMsg('Event duration must be at least 15 minutes.');
      return;
    }
    if (durationMinutes > 24 * 60) {
      setErrorMsg('Event duration seems too long.');
      return;
    }

    try {
      await api.post('/events', {
        title: form.title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: form.status,
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setForm({ title: '', start_time: '', end_time: '', status: 'BUSY' });
      setShowForm(false);
    } catch (err: any) {
      console.error('Failed to create event:', err);
      // Log server response body if available to help debugging
      if (err?.response?.data) {
        console.error('Server error data:', err.response.data);
        // Try to display a friendly message from server. FastAPI returns {detail: ...}
        const detail = err.response.data.detail ?? err.response.data;
        if (typeof detail === 'string') setErrorMsg(detail);
        else if (detail?.message) setErrorMsg(detail.message);
        else setErrorMsg(JSON.stringify(detail));
      } else {
        setErrorMsg('Failed to create event. Please try again.');
      }
    }
  };

  const makeSwappable = async (event: Event) => {
    try {
      await api.put(`/events/${event.id}`, { ...event, status: 'SWAPPABLE' });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const deleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BUSY':
        return 'bg-slate-100/80 text-slate-700 ring-1 ring-slate-700/10';
      case 'SWAPPABLE':
        return 'bg-green-100/80 text-green-700 ring-1 ring-green-700/20';
      case 'SWAP_PENDING':
        return 'bg-yellow-100/80 text-yellow-700 ring-1 ring-yellow-700/20';
      default:
        return 'bg-slate-100/80 text-slate-700 ring-1 ring-slate-700/10';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
          Loading your events...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">My Events</h1>
          <p className="mt-2 text-slate-600 max-w-2xl">
            Manage your schedule and make slots available for swapping with other users. Keep track of your busy and swappable time slots.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Event
        </button>
      </div>

      {showForm && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200/50 p-8">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">Create New Event</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {errorMsg}
              </div>
            )}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                Event Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Enter event title"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start" className="block text-sm font-medium text-slate-700 mb-2">
                  Start Time
                </label>
                <input
                  id="start"
                  type="datetime-local"
                  required
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="end" className="block text-sm font-medium text-slate-700 mb-2">
                  End Time
                </label>
                <input
                  id="end"
                  type="datetime-local"
                  required
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all"
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200/50 p-16 text-center">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-slate-50 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">No events yet</h3>
          <p className="text-slate-600 max-w-sm mx-auto">
            Create your first event to start managing your schedule and make slots available for swapping.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        event.status
                      )}`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-slate-600 space-x-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(event.start_time).toLocaleString()}
                    </div>
                    <span>→</span>
                    <div>{new Date(event.end_time).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {event.status === 'BUSY' && (
                    <button
                      onClick={() => makeSwappable(event)}
                      className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50/80 border border-green-200/50 rounded-lg hover:bg-green-100/80 hover:shadow-md shadow-green-500/10 transition-all"
                    >
                      Make Swappable
                    </button>
                  )}
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-2.5 text-red-600 hover:bg-red-50/80 rounded-lg transition-all hover:shadow-md shadow-red-500/10"
                    title="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
