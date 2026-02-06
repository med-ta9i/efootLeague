import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        try {
            await api.post('/users/password-reset/confirm/', {
                uidb64: uid,
                token: token,
                password: password
            });
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError('Invalid link or expired token.');
        }
    };

    if (!uid || !token) {
        return <div className="container">Invalid password reset link.</div>;
    }

    return (
        <div style={{ maxWidth: '400px', margin: '2rem auto' }} className="card">
            <h2>Reset Password</h2>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!message && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                    <button type="submit" className="btn btn-primary">Reset Password</button>
                </form>
            )}
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                <Link to="/login">Back to Login</Link>
            </p>
        </div>
    );
};

export default ResetPassword;
