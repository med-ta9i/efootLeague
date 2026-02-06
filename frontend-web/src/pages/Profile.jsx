import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
    const { user, login } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [whatsapp, setWhatsapp] = useState(user?.num_whatsapp || '');
    const [avatar, setAvatar] = useState(null);
    const [teamPhoto, setTeamPhoto] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!user) return <div>Loading...</div>;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('num_whatsapp', whatsapp);
        if (avatar) formData.append('avatar', avatar);
        if (teamPhoto) formData.append('team_photo', teamPhoto);

        try {
            const response = await api.put('/users/profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update the user in AuthContext (assuming login(userData) can be reused or just refreshing profile)
            // For now, let's suggest a refresh or if login update is implemented
            alert("Profil mis à jour !");
            setIsEditing(false);
            window.location.reload(); // Quick way to sync AuthContext for now
        } catch (error) {
            alert("Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Mon Profil</h1>
                <button onClick={() => setIsEditing(!isEditing)} className="btn btn-outline">
                    {isEditing ? 'Annuler' : 'Modifier le profil'}
                </button>
            </header>

            <div className="card">
                {isEditing ? (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Numéro WhatsApp</label>
                            <input
                                type="text"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                className="input-field"
                                placeholder="+212 ..."
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Photo de Profil (Avatar)</label>
                            <input
                                type="file"
                                onChange={(e) => setAvatar(e.target.files[0])}
                                accept="image/*"
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Photo de l'équipe</label>
                            <input
                                type="file"
                                onChange={(e) => setTeamPhoto(e.target.files[0])}
                                accept="image/*"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Enregistrement...' : 'Sauvegarder les modifications'}
                        </button>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                            {user.avatar ? (
                                <img src={user.avatar} alt="Avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary)' }} />
                            ) : (
                                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #6f42c1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'white', fontWeight: 'bold' }}>
                                    {user.username.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h2 style={{ margin: 0, fontSize: '2rem' }}>{user.username}</h2>
                                <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0' }}>{user.email}</p>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <div style={{ background: '#e9ecef', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
                                        📱 WhatsApp: <strong>{user.num_whatsapp || 'Non défini'}</strong>
                                    </div>
                                    <div style={{ background: '#e9ecef', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
                                        📅 Inscription: <strong>{new Date(user.date_joined).toLocaleDateString()}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {user.team_photo && (
                            <div style={{ marginTop: '1rem' }}>
                                <h3>Mon Équipe</h3>
                                <img src={user.team_photo} alt="Team" style={{ width: '100%', maxHeight: '400px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
