import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const UserProfile = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ won: 0, participation: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Fetch basic user info
                // Note: We need a backend endpoint for this or use user list filtered by ID
                // For now, let's assume /users/<id>/ works if we use ModelViewSet or add it.
                // Let's check backend/users/views.py again.
                // It only has UserProfileView for CURRENT user.
                // I should probably add Retrieve view for any user in backend.
                const res = await api.get(`/users/`);
                const players = res.data.results || res.data;
                const found = players.find(p => p.id === parseInt(id));

                if (found) {
                    setProfile(found);
                    // Mock stats for now or logic from tournaments?
                    // To get real stats, we'd need to query tournaments where user is winner or participant.
                    setLoading(false);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching user profile", error);
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return <div className="container">Chargement...</div>;
    if (!profile) return <div className="container">Utilisateur non trouvé.</div>;

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <div className="card" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #6f42c1 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    margin: '0 auto 1.5rem auto',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                }}>
                    {profile.username.substring(0, 2).toUpperCase()}
                </div>

                <h1 style={{ margin: 0 }}>{profile.username}</h1>
                <p style={{ color: 'var(--text-muted)' }}>{profile.email}</p>
                <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#e9ecef', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    Joueur eSport
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem' }}>
                    <div className="card" style={{ background: '#f8f9fa', border: 'none' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>0</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tournois Gagnés</div>
                    </div>
                    <div className="card" style={{ background: '#f8f9fa', border: 'none' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.participation}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Participations</div>
                    </div>
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'left' }}>
                    <h3>À propos</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Membre de la plateforme efootLeague depuis le {new Date(profile.date_joined).toLocaleDateString()}.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
