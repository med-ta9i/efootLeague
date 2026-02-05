import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const TournamentDetail = () => {
    const { id } = useParams();
    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tRes, mRes, sRes] = await Promise.all([
                    api.get(`/tournaments/${id}/`),
                    api.get(`/matches/?tournament=${id}`),
                    api.get(`/matches/standings/?tournament=${id}`)
                ]);
                setTournament(tRes.data);
                setMatches(mRes.data);
                setStandings(sRes.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleJoin = async () => {
        try {
            await api.post(`/tournaments/${id}/join/`, { join_code: joinCode });
            // Refresh
            window.location.reload();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to join");
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!tournament) return <div>Tournament not found</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem' }}>
                <h1>{tournament.name}</h1>
                <p>{tournament.description}</p>
                {tournament.visibility === 'PRIVATE' && (
                    <div style={{ marginTop: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Join Code"
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value)}
                            style={{ padding: '0.5rem', marginRight: '0.5rem' }}
                        />
                        <button onClick={handleJoin} className="btn btn-primary">Join</button>
                    </div>
                )}
            </header>

            {tournament.type !== 'CUP' && (
                <section style={{ marginBottom: '2rem' }}>
                    <h2>Standings</h2>
                    <div className="card" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '0.5rem' }}>Player</th>
                                    <th style={{ padding: '0.5rem' }}>P</th>
                                    <th style={{ padding: '0.5rem' }}>W</th>
                                    <th style={{ padding: '0.5rem' }}>D</th>
                                    <th style={{ padding: '0.5rem' }}>L</th>
                                    <th style={{ padding: '0.5rem' }}>GD</th>
                                    <th style={{ padding: '0.5rem' }}>Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.5rem' }}>{s.player.username}</td>
                                        <td style={{ padding: '0.5rem' }}>{s.played}</td>
                                        <td style={{ padding: '0.5rem' }}>{s.wins}</td>
                                        <td style={{ padding: '0.5rem' }}>{s.draws}</td>
                                        <td style={{ padding: '0.5rem' }}>{s.losses}</td>
                                        <td style={{ padding: '0.5rem' }}>{s.goal_difference}</td>
                                        <td style={{ padding: '0.5rem' }}>{s.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            <section>
                <h2>Matches</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {matches.map(match => (
                        <div key={match.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1, textAlign: 'right' }}>{match.player1.username}</div>
                            <div style={{ padding: '0 1rem', fontWeight: 'bold' }}>
                                {match.status === 'PLAYED' || match.status === 'LOCKED' ?
                                    `${match.score_player1} - ${match.score_player2}` :
                                    'vs'}
                            </div>
                            <div style={{ flex: 1, textAlign: 'left' }}>{match.player2.username}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {match.status}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default TournamentDetail;
