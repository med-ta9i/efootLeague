import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="container">
            <h1>Welcome, {user?.username}!</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                <div className="card">
                    <h3>My Tournaments</h3>
                    <p>Manage or view tournaments you are participating in.</p>
                    <Link to="/tournaments" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>View Tournaments</Link>
                </div>
                <div className="card">
                    <h3>Create Tournament</h3>
                    <p>Host your own league or cup.</p>
                    <Link to="/tournaments/create" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Create</Link>
                </div>
                <div className="card">
                    <h3>Friends</h3>
                    <p>Manage your friends list.</p>
                    <Link to="/friends" className="btn btn-outline" style={{ display: 'inline-block', marginTop: '1rem' }}>View Friends</Link>
                </div>
                <div className="card">
                    <h3>Notifications</h3>
                    <p>Check your latest updates.</p>
                    <Link to="/notifications" className="btn btn-outline" style={{ display: 'inline-block', marginTop: '1rem' }}>View Notifications</Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
