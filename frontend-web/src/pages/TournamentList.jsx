import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const TournamentList = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await api.get('/tournaments/');
                setTournaments(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Tournaments</h2>
                <Link to="/tournaments/create" className="btn btn-primary">Create New</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {tournaments.map(t => (
                    <div key={t.id} className="card">
                        <h3>{t.name}</h3>
                        <p>{t.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                            <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                background: 'var(--border)',
                                fontSize: '0.8rem'
                            }}>
                                {t.type}
                            </span>
                            <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                background: t.status === 'ONGOING' ? 'green' : 'var(--border)',
                                fontSize: '0.8rem'
                            }}>
                                {t.status}
                            </span>
                        </div>
                        <Link to={`/tournaments/${t.id}`} className="btn btn-outline" style={{ display: 'block', textAlign: 'center', marginTop: '1rem' }}>
                            View Details
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TournamentList;
