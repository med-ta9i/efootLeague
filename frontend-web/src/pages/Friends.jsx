import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Friends = () => {
    const { user } = useAuth();
    const [friendships, setFriendships] = useState([]);
    const [usernameInput, setUsernameInput] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchFriendships = async () => {
        try {
            setLoading(true);
            const res = await api.get('/friends/');
            // Handle paginated response
            setFriendships(res.data.results ? res.data.results : res.data);
        } catch (error) {
            console.error("Error fetching friendships", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriendships();
    }, []);

    const sendRequest = async (e) => {
        e.preventDefault();
        try {
            await api.post('/friends/request/', { username: usernameInput });
            setUsernameInput('');
            alert('Demande envoyée avec succès');
            fetchFriendships();
        } catch (error) {
            alert(error.response?.data?.error || 'Échec de l\'envoi de la demande');
        }
    };

    const handleAction = async (id, action) => {
        try {
            await api.post(`/friends/${id}/${action}/`);
            fetchFriendships();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="container">Chargement...</div>;

    const receivedRequests = friendships.filter(f => f.status === 'PENDING' && f.receiver.id === user?.id);
    const sentRequests = friendships.filter(f => f.status === 'PENDING' && f.sender.id === user?.id);
    const friendsList = friendships.filter(f => f.status === 'ACCEPTED');

    return (
        <div className="container">
            <h2>Amis et Demandes</h2>

            <form onSubmit={sendRequest} className="card" style={{ margin: '1rem 0', display: 'flex', gap: '0.5rem' }}>
                <input
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    placeholder="Ajouter un ami par nom d'utilisateur"
                    style={{ padding: '0.5rem', flex: 1 }}
                />
                <button type="submit" className="btn btn-primary">Ajouter</button>
            </form>

            <section style={{ marginTop: '2rem' }}>
                <h3>Demandes reçues</h3>
                {receivedRequests.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>aucune demande reçue</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {receivedRequests.map(f => (
                            <div key={f.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{f.sender.username}</span>
                                <div>
                                    <button onClick={() => handleAction(f.id, 'accept')} className="btn btn-primary" style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem' }}>Accepter</button>
                                    <button onClick={() => handleAction(f.id, 'reject')} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', color: 'red' }}>Refuser</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h3>Demandes envoyées</h3>
                {sentRequests.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>aucune demande envoyée</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {sentRequests.map(f => (
                            <div key={f.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{f.receiver.username}</span>
                                <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>En attente...</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h3>Mes amis</h3>
                {friendsList.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>vous n'avez pas d'amis</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {friendsList.map(f => {
                            const friendObj = f.sender.id === user?.id ? f.receiver : f.sender;
                            return (
                                <div key={f.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{friendObj.username}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'green' }}>✓ Ami</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Friends;
