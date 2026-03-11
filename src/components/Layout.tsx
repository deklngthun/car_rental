import React from 'react';
import { NavLink } from 'react-router-dom';
import { PlusCircle, List, BarChart3, Car, Home, Calendar } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="app-layout">
            {/* Header */}
            <header className="app-header">
                <div className="app-header__logo">
                    <div className="app-header__logo-icon">
                        <Car size={20} />
                    </div>
                    <div>
                        <div className="app-header__title">RentFlow</div>
                        <div className="app-header__subtitle">Vehicle Rental Manager</div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
                    }
                    end
                >
                    <Home size={22} />
                    <span>Home</span>
                </NavLink>
                <NavLink
                    to="/schedule"
                    className={({ isActive }) =>
                        `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
                    }
                >
                    <Calendar size={22} />
                    <span>Schedule</span>
                </NavLink>
                <NavLink
                    to="/new"
                    className={({ isActive }) =>
                        `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
                    }
                >
                    <PlusCircle size={22} />
                    <span>New</span>
                </NavLink>
                <NavLink
                    to="/rentals"
                    className={({ isActive }) =>
                        `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
                    }
                >
                    <List size={22} />
                    <span>History</span>
                </NavLink>
                <NavLink
                    to="/reports"
                    className={({ isActive }) =>
                        `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
                    }
                >
                    <BarChart3 size={22} />
                    <span>Reports</span>
                </NavLink>
            </nav>
        </div>
    );
}
