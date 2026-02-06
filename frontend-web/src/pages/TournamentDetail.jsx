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
    const [participants, setParticipants] = useState([]);
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

                // Fetch Participants
                try {
                    const pRes = await api.get(`/tournaments/${id}/participants/`);
                    // Check for pagination results just in case, though action might not be paginated
                    setParticipants(pRes.data.results ? pRes.data.results : pRes.data);
                } catch (e) { console.warn("Participants fetch failed", e); }

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

    const handleStartTournament = async () => {
        if (!window.confirm("Start tournament? This will lock players and generate matches.")) return;
        try {
            await api.post(`/tournaments/${id}/start_tournament/`);
            alert('Tournament started!');
            window.location.reload();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to start tournament");
        }
    };

    const handleGenerateNextRound = async () => {
        try {
            const res = await api.post(`/tournaments/${id}/generate_next_round/`);
            alert(res.data.message || 'Next round generated!');
            window.location.reload();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to generate next round");
        }
    };

    const [editingMatchId, setEditingMatchId] = useState(null);
    const [editScores, setEditScores] = useState({ s1: 0, s2: 0 });

    const startEditing = (match) => {
        setEditingMatchId(match.id);
        setEditScores({ s1: match.score_player1, s2: match.score_player2 });
    };

    const handleSaveScore = async (matchId, statusOverride = null) => {
        try {
            const data = {
                score_player1: editScores.s1,
                score_player2: editScores.s2,
                status: statusOverride || 'PLAYED'
            };
            await api.patch(`/matches/${matchId}/`, data);
            alert('Score updated');
            setEditingMatchId(null);
            window.location.reload();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to update score");
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

                {tournament.status === 'FINISHED' && tournament.winner && (
                    <div className="card" style={{
                        marginTop: '1.5rem',
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        color: '#000',
                        textAlign: 'center',
                        padding: '2rem',
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>
                        <h2 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Champion</h2>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                            {tournament.winner.username}
                        </div>
                    </div>
                )}

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

                        {tournament.status === 'DRAFT' && participants.length >= 2 && (
                            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                <button onClick={handleStartTournament} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', background: '#28a745' }}>
                                    Lancer le tournoi
                                </button>
                            </div>
                        )}

                        {tournament.status === 'ONGOING' && tournament.type !== 'LEAGUE' && (
                            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                <button onClick={handleGenerateNextRound} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', background: '#007bff' }}>
                                    Générer le tour suivant
                                </button>
                            </div>
                        )}

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

            <section style={{ marginBottom: '2rem' }}>
                <h2>Joueurs ({participants.length})</h2>
                <div className="card">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                        {participants.map(p => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px' }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                    {p.user.username.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{p.user.username}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {participants.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Aucun joueur inscrit.</p>}
                </div>
            </section>

            <section>
                <h2>Matches</h2>
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {Object.entries((matches || []).reduce((acc, match) => {
                        const r = match.round || 'Général';
                        if (!acc[r]) acc[r] = [];
                        acc[r].push(match);
                        return acc;
                    }, {})).map(([roundName, roundMatches]) => (
                        <div key={roundName}>
                            <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                                {roundName}
                            </h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {roundMatches.map(match => (
                                    <div key={match.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '1rem' }}>
                                            <div style={{ flex: 1, textAlign: 'right' }}>{match.player1.username}</div>

                                            {editingMatchId === match.id ? (
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editScores.s1}
                                                        onChange={e => setEditScores({ ...editScores, s1: Math.max(0, parseInt(e.target.value) || 0) })}
                                                        style={{ width: '50px', textAlign: 'center' }}
                                                    />
                                                    <span>-</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editScores.s2}
                                                        onChange={e => setEditScores({ ...editScores, s2: Math.max(0, parseInt(e.target.value) || 0) })}
                                                        style={{ width: '50px', textAlign: 'center' }}
                                                    />
                                                </div>
                                            ) : (
                                                <div style={{ padding: '0 1rem', fontWeight: 'bold', minWidth: '80px', textAlign: 'center' }}>
                                                    {match.status === 'PLAYED' || match.status === 'LOCKED' ?
                                                        `${match.score_player1} - ${match.score_player2}` :
                                                        'vs'}
                                                </div>
                                            )}

                                            <div style={{ flex: 1, textAlign: 'left' }}>{match.player2.username}</div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '80px' }}>
                                                {match.status}
                                            </div>

                                            {tournament.is_admin && match.status !== 'LOCKED' && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {editingMatchId === match.id ? (
                                                        <>
                                                            <button onClick={() => handleSaveScore(match.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Save</button>
                                                            <button onClick={() => handleSaveScore(match.id, 'LOCKED')} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#dc3545' }}>Lock</button>
                                                            <button onClick={() => setEditingMatchId(null)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Cancel</button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => startEditing(match)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Modifier le score</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default TournamentDetail;
