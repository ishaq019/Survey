import React from 'react';
import { Link } from 'react-router-dom';
import AppLogo from './AppLogo';
import { getReturnUrl } from '../utils/returnUrl';
import ThemeToggle from './common/ThemeToggle';

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-brand-group">
        <Link className="nav-brand" to="/">
          <AppLogo size={30} className="nav-brand-logo" />
          <span className="nav-brand-text">
            <span className="nav-brand-name">Survey App</span>
            <span className="nav-brand-subtitle">Public survey workspace</span>
          </span>
        </Link>
      </div>

      <div className="nav-links">
        <a className="nav-link" href={getReturnUrl('/admin/exams')}>
          Back to Quiz App
        </a>
      </div>

      <div className="nav-actions">
        <ThemeToggle />
        <span className="nav-user">
          <span className="nav-user-name">No login required</span>
          <span className="nav-user-role">Public mode</span>
        </span>
      </div>
    </nav>
  );
}
