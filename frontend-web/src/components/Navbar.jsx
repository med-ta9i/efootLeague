import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="container nav-content">
                <Link to="/" className="brand">efootLeague</Link>
                <div className="nav-links">
                    {user ? (
                        <>
                            <Link to="/tournaments">Tournaments</Link>
                            <Link to="/notifications">Notifications</Link>
                            <Link to="/profile">Profile</Link>
                            <button onClick={handleLogout} className="btn btn-outline">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/register" className="btn btn-primary">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
