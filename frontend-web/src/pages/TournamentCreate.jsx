import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TournamentCreate = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'LEAGUE',
        visibility: 'PUBLIC',
        max_players: 16
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/tournaments/', formData);
            navigate(`/tournaments/${res.data.id}`);
        } catch (error) {
            console.error(error);
            alert('Failed to create tournament');
        }
    };

    return (
        <div className="container">
            <h1>Create Tournament</h1>
            <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '600px', display: 'grid', gap: '1rem' }}>
                <div>
                    <label>Name</label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                    />
                </div>
                <div>
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                    />
                </div>
                <div>
                    <label>Type</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                    >
                        <option value="LEAGUE">League</option>
                        <option value="CUP">Cup</option>
                        <option value="BOTH">League + Cup</option>
                    </select>
                </div>
                <div>
                    <label>Visibility</label>
                    <select
                        name="visibility"
                        value={formData.visibility}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                    >
                        <option value="PUBLIC">Public</option>
                        <option value="PRIVATE">Private</option>
                    </select>
                </div>
                <div>
                    <label>Max Players</label>
                    <input
                        type="number"
                        name="max_players"
                        min="2"
                        value={formData.max_players}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                    />
                </div>
                <button type="submit" className="btn btn-primary">Create</button>
            </form>
        </div>
    );
};

export default TournamentCreate;
