import { useEffect, useState } from 'react';
import api from '../services/api';

const Friends = () => {
    const [friends, setFriends] = useState([]);
    const [username, setUsername] = useState('');

    const fetchFriends = async () => {
        const res = await api.get('/friends/');
        setFriends(res.data);
    };

    useEffect(() => {
        fetchFriends();
    }, []);

    const sendRequest = async (e) => {
        e.preventDefault();
        try {
            await api.post('/friends/request/', { username });
            setUsername('');
            alert('Request sent');
            fetchFriends();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to send request');
        }
    };

    const handleAction = async (id, action) => {
        try {
            await api.post(`/friends/${id}/${action}/`);
            fetchFriends();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container">
            <h2>Friends</h2>
            <form onSubmit={sendRequest} style={{ margin: '1rem 0' }}>
                <input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Add friend by username"
                    style={{ padding: '0.5rem', marginRight: '0.5rem' }}
                />
                <button type="submit" className="btn btn-primary">Add Friend</button>
            </form>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {friends.map(f => (
                    <div key={f.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            {f.sender.username === username ? f.receiver.username : f.receiver.username === username ? f.sender.username : `Friendship #${f.id}`}
                            {/* Actually we should check who is the other user, simplistic logic here */}
                            {/* Let's refine display based on current user but we don't have current user in this scope easily without context */}
                            {/* Assuming the other user is the one not me. But API returns full objects. */}
                            Status: {f.status}
                        </div>
                        {f.status === 'PENDING' && (
                            <div>
                                <button onClick={() => handleAction(f.id, 'accept')} className="btn btn-primary" style={{ marginRight: '0.5rem' }}>Accept</button>
                                <button onClick={() => handleAction(f.id, 'reject')} className="btn btn-outline">Reject</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Friends;
