import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div>
            <Navbar />
            <main className="container" style={{ padding: '2rem 0' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
