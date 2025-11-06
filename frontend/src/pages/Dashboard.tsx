import { useState, FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import '../styles/SlotSwapper.css';

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

    if (!form.title || !form.start_time || !form.end_time) {
      setErrorMsg('Please fill all required fields.');
      return;
    }

    const start = new Date(form.start_time);
    const end = new Date(form.end_time);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setErrorMsg('Invalid date format.');
      return;
    }

    if (start >= end) {
      setErrorMsg('Start time must be before end time.');
      return;
    }

    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    if (durationMinutes < 15) {
      setErrorMsg('Event duration must be at least 15 minutes.');
      return;
    }
    if (durationMinutes > 24 * 60) {
      setErrorMsg('Event duration cannot exceed 24 hours.');
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
      if (err?.response?.data) {
        console.error('Server error data:', err.response.data);
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

  const deleteEvent = async (event: Event) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${event.id}`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="slot-swapper">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="slot-swapper">
      <div className="page-header">
        <h1 className="page-title">Schedule Manager</h1>
        <p className="page-description">
          Smart scheduling and slot swapping made simple
        </p>
      </div>

      <div className="text-right mb-8">
        <button onClick={() => setShowForm(!showForm)} className="create-button">
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      {showForm && (
        <div className="event-form">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">New Event</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="form-input"
                placeholder="Enter event title"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="action-button bg-gray-50 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button type="submit" className="create-button">
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        <div className="empty-state">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Yet</h3>
          <p className="text-gray-600">Create your first event to start managing your schedule</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="event-title">{event.title}</h3>
                  <div className="space-y-1">
                    <div className="event-time">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.start_time).toLocaleDateString()}
                    </div>
                    <div className="event-time">
                      <Clock className="w-4 h-4" />
                      {new Date(event.start_time).toLocaleTimeString()} -{' '}
                      {new Date(event.end_time).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span
                    className={`status-badge ${
                      event.status === 'BUSY' ? 'status-busy' : 'status-swappable'
                    }`}
                  >
                    {event.status}
                  </span>

                  <div className="flex items-center space-x-2">
                    {event.status === 'BUSY' && (
                      <button
                        onClick={() => makeSwappable(event)}
                        className="action-button action-swap"
                      >
                        Make Swappable
                      </button>
                    )}
                    <button
                      onClick={() => deleteEvent(event)}
                      className="action-button action-delete"
                      title="Delete event"
                    >
                      <Trash2 className="w-5 h-5" />
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