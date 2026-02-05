import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TournamentDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [inviteUsername, setInviteUsername] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Tournament Details
                const tRes = await api.get(`/tournaments/${id}/`);
                setTournament(tRes.data);

                // Fetch Matches (Ignore error if fails)
                try {
                    const mRes = await api.get(`/matches/?tournament=${id}`);
                    setMatches(mRes.data.results ? mRes.data.results : mRes.data);
                } catch (e) { console.warn("Matches fetch failed", e); }

                // Fetch Standings (Ignore error if fails)
                try {
                    const sRes = await api.get(`/matches/standings/?tournament=${id}`);
                    setStandings(sRes.data.results ? sRes.data.results : sRes.data);
                } catch (e) { console.warn("Standings fetch failed", e); }

            } catch (error) {
                console.error(error);
                setErrorMsg(error.message);
                if (error.response && error.response.status === 404) {
                    setErrorMsg("Tournament not found (404)");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleJoin = async () => {
        try {
            const res = await api.post(`/tournaments/${id}/join/`, { join_code: joinCode });
            alert(res.data.message || "Joined successfully");
            window.location.reload();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to join");
        }
    };

    const handleInvite = async () => {
        try {
            await api.post(`/tournaments/invitations/create_invitation/`, {
                username: inviteUsername,
                tournament_id: id
            });
            alert('Invitation sent successfully');
            setInviteUsername('');
        } catch (error) {
            alert(error.response?.data?.error || "Failed to send invitation");
        }
    };

    const handleApproveRequest = async (requestId) => {
        try {
            await api.post(`/tournaments/requests/${requestId}/approve/`);
            alert('Request approved!');
            window.location.reload();
        } catch (error) {
            alert('Failed to approve request');
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await api.post(`/tournaments/requests/${requestId}/reject/`);
            alert('Request rejected.');
            window.location.reload();
        } catch (error) {
            alert('Failed to reject request');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (errorMsg) return <div>Error: {errorMsg}</div>;
    if (!tournament) return <div>Tournament not found (State is null)</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem' }}>
                <h1>{tournament.name}</h1>
                <p>{tournament.description}</p>
                <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'gray' }}>
                    Type: {tournament.type} | Visibility: {tournament.visibility} | Status: {tournament.status}
                </div>

                {/* Status for normal user */}
                {!tournament.is_admin && (
                    <div style={{ marginTop: '0.5rem' }}>
                        {tournament.is_participant ? (
                            <span style={{ color: 'green', fontWeight: 'bold' }}>✓ You are a Participant</span>
                        ) : tournament.pending_request_status ? (
                            <span style={{ color: 'orange', fontWeight: 'bold' }}>⟳ Request Sent (Pending)</span>
                        ) : null}
                    </div>
                )}

                {/* Admin Section */}
                {tournament.is_admin && (
                    <div className="card" style={{ marginTop: '1rem', background: '#f8f9fa', border: '1px solid #ddd' }}>
                        <h3>Admin Controls</h3>
                        {tournament.visibility === 'PRIVATE' && (
                            <p><strong>Join Code:</strong> {tournament.join_code}</p>
                        )}

                        <div style={{ marginTop: '1rem' }}>
                            <label><strong>Invite Player:</strong></label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={inviteUsername}
                                    onChange={(e) => setInviteUsername(e.target.value)}
                                    placeholder="Enter username"
                                    style={{ padding: '0.5rem', flex: 1 }}
                                />
                                <button onClick={handleInvite} className="btn btn-primary">Invite</button>
                            </div>
                        </div>

                        {tournament.join_requests && tournament.join_requests.length > 0 && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <h4>Pending Join Requests</h4>
                                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {tournament.join_requests.map(req => (
                                        <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem' }}>
                                            <span>{req.user.username}</span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleApproveRequest(req.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Approve</button>
                                                <button onClick={() => handleRejectRequest(req.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'red' }}>Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Join Section */}
                {!tournament.is_admin && !tournament.is_participant && !tournament.pending_request_status && (
                    <div style={{ marginTop: '1rem' }}>
                        {tournament.visibility === 'PRIVATE' ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Enter Join Code"
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value)}
                                    style={{ padding: '0.5rem' }}
                                />
                                <button onClick={handleJoin} className="btn btn-primary">Join Private Tournament</button>
                            </div>
                        ) : (
                            <button onClick={handleJoin} className="btn btn-primary">Join Public Tournament</button>
                        )}
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
