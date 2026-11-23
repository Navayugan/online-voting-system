import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrg } from '../../context/OrgContext';

export default function LandingPage() {
  const brandName = 'OVMS';
  const { terms } = useOrg();
  const memberSingular = terms?.memberSingular || 'Voter';

  useEffect(() => {
    document.title = 'Online Voting System';
  }, []);

  const highlights = [
    { title: 'Secure Voting', desc: 'Votes are stored separately from voter identity to protect ballot secrecy.' },
    { title: 'Real-time Analytics', desc: 'Live monitoring of election participation.' },
    { title: 'Enterprise Ready', desc: 'Role-based access for seamless administration.' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a192f', // Midnight Navy
      color: '#ffffff',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Navbar */}
      <nav style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-1px', color: '#ff3333' }}>
          {brandName}
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <Link to="/admin-login" style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 51, 51, 0.6)',
            color: '#ff6666',
            textDecoration: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.3px',
            transition: 'all 0.2s'
          }}>
            Admin Login
          </Link>
          <Link to="/login" style={{
            padding: '10px 22px',
            background: 'linear-gradient(135deg, #0047ab, #3b82f6)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.3px',
            boxShadow: '0 8px 20px rgba(0,71,171,0.3)',
            transition: 'all 0.2s'
          }}>
            {memberSingular} Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '64px 24px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(48px, 8vw, 96px)',
          fontWeight: '700',
          letterSpacing: '-2px',
          marginBottom: '24px',
          lineHeight: 1.1,
          maxWidth: '900px'
        }}>
          Elevate Your <span style={{ color: '#ff3333' }}>Democracy</span>
        </h1>
        <p style={{
          fontSize: '22px',
          color: '#8892b0',
          maxWidth: '600px',
          marginBottom: '40px',
          lineHeight: 1.6
        }}>
          The premier online voting system for modern organizations. Simple, elegant, and uncompromisingly secure.
        </p>

        {/* Hero CTAs */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '72px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/login" style={{
            padding: '15px 36px',
            background: 'linear-gradient(135deg, #0047ab, #3b82f6)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            boxShadow: '0 12px 28px rgba(0,71,171,0.4)',
            transition: 'transform 0.15s'
          }}>
            🗳️ {memberSingular} Sign In
          </Link>
          <Link to="/admin-login" style={{
            padding: '15px 30px',
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            🛡️ Admin Portal
          </Link>
        </div>

        {/* Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
          width: '100%',
          maxWidth: '1000px'
        }}>
          {highlights.map((h, i) => (
            <div key={i} style={{
              padding: '40px',
              borderTop: '3px solid #0047ab', // Cobalt Blue highlight
              backgroundColor: 'rgba(255,255,255,0.02)',
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#ffffff', letterSpacing: '-0.5px' }}>{h.title}</h3>
              <p style={{ color: '#8892b0', fontSize: '18px', lineHeight: 1.5, margin: 0 }}>{h.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '32px', textAlign: 'center', color: '#8892b0', fontSize: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        © {new Date().getFullYear()} {brandName}
      </footer>
    </div>
  );
}
