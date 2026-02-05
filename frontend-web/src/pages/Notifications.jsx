import { useEffect, useState } from 'react';
import api from '../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async () => {
        const res = await api.get('/notifications/');
        setNotifications(res.data);
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        await api.post(`/notifications/${id}/read/`);
        fetchNotifications();
    };

    const markAllAsRead = async () => {
        await api.post('/notifications/read-all/');
        fetchNotifications();
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Notifications</h2>
                <button onClick={markAllAsRead} className="btn btn-outline">Mark all as read</button>
            </div>
            <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
                {notifications.map(n => (
                    <div key={n.id} className="card" style={{ opacity: n.is_read ? 0.6 : 1 }}>
                        <p>{n.content}</p>
                        <small>{new Date(n.created_at).toLocaleString()}</small>
                        {!n.is_read && (
                            <button onClick={() => markAsRead(n.id)} style={{ marginLeft: '1rem', color: 'var(--primary)' }}>
                                Mark as read
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notifications;
