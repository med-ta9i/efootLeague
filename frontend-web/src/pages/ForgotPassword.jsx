import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await api.post('/users/password-reset/', { email });
            setMessage('If an account exists, a reset link has been sent to your email.');
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '2rem auto' }} className="card">
            <h2>Forgot Password</h2>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '0.5rem' }}
                />
                <button type="submit" className="btn btn-primary">Send Reset Link</button>
            </form>
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                <Link to="/login">Back to Login</Link>
            </p>
        </div>
    );
};

export default ForgotPassword;
