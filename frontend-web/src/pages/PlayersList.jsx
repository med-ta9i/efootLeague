import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const PlayersList = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [friendships, setFriendships] = useState([]);
    const [myTournaments, setMyTournaments] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, friendsRes, tourRes] = await Promise.all([
                    api.get('/users/'),
                    api.get('/friends/'),
                    api.get('/tournaments/')
                ]);

                setPlayers(usersRes.data.results || usersRes.data);
                setFriendships(friendsRes.data.results || friendsRes.data);
                // Filter tournaments where user is admin to allow invitations
                setMyTournaments((tourRes.data.results || tourRes.data).filter(t => t.is_admin && t.status === 'DRAFT'));
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch players", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSendFriendRequest = async (username) => {
        try {
            await api.post('/friends/request/', { username });
            alert("Demande d'ami envoyée !");
        } catch (error) {
            alert(error.response?.data?.error || "Erreur lors de l'envoi");
        }
    };

    const handleInviteToTournament = async (userId, tournamentId) => {
        try {
            // Assuming we have an invite endpoint by ID or we need to fetch username
            const player = players.find(p => p.id === userId);
            await api.post('/tournaments/invite_player/', {
                tournament_id: tournamentId,
                username: player.username
            });
            alert("Invitation envoyée !");
        } catch (error) {
            alert(error.response?.data?.error || "Erreur lors de l'invitation");
        }
    };

    if (loading) return <div className="container">Chargement...</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem' }}>
                <h1>Liste des Joueurs</h1>
                <p style={{ color: 'var(--text-muted)' }}>Découvrez la communauté et invitez des adversaires.</p>
            </header>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {players.map(player => (
                    <div key={player.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {player.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <Link to={`/users/${player.id}`} style={{ fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none', color: 'var(--primary)' }}>
                                    {player.username}
                                </Link>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Membre depuis: {new Date(player.date_joined).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleSendFriendRequest(player.username)} className="btn btn-outline" style={{ fontSize: '0.9rem' }}>
                                Ajouter ami
                            </button>

                            {myTournaments.length > 0 && (
                                <div className="dropdown" style={{ position: 'relative' }}>
                                    <button className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
                                        Inviter
                                    </button>
                                    <div className="dropdown-content" style={{ position: 'absolute', right: 0, top: '100%', background: 'white', border: '1px solid #ddd', borderRadius: '4px', zIndex: 10, minWidth: '150px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                        {myTournaments.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleInviteToTournament(player.id, t.id)}
                                                style={{ width: '100%', padding: '0.5rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                                onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
                                                onMouseOut={(e) => e.target.style.background = 'none'}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {players.length === 0 && <p>Aucun autre joueur trouvé.</p>}
            </div>
        </div>
    );
};

export default PlayersList;
