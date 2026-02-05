import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();

    if (!user) return <div>Loading...</div>;

    return (
        <div className="container">
            <h1>Profile</h1>
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
                    ) : (
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--border)' }}></div>
                    )}
                    <div>
                        <h2>{user.username}</h2>
                        <p>{user.email}</p>
                        <p>WhatsApp: {user.num_whatsapp || 'Not set'}</p>
                        <p>Joined: {new Date(user.date_joined).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
