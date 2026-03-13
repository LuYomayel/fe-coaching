import { useState } from 'react';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { useIntl } from 'react-intl';

export interface HeaderProps {
  isScrolled: boolean;
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onScrollToFeatures: () => void;
  onScrollToPricing: () => void;
  onScrollToContact: () => void;
}

const Header = ({
  isScrolled,
  onLoginClick,
  onSignUpClick,
  onScrollToFeatures,
  onScrollToPricing,
  onScrollToContact
}: HeaderProps) => {
  const intl = useIntl();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const handleMobileNav = (action: () => void) => {
    setMobileMenuVisible(false);
    action();
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-5"
        style={{
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          background: isScrolled ? 'var(--ios-glass-bg)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(24px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(24px)' : 'none',
          borderBottom: isScrolled ? '1px solid var(--ios-divider)' : '1px solid transparent',
          boxShadow: isScrolled ? 'var(--ios-shadow-sm)' : 'none'
        }}
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1200px' }}>
          <div className="flex align-items-center justify-content-between" style={{ height: '3.5rem' }}>
            {/* Logo */}
            <div className="flex align-items-center gap-2">
              <div
                className="flex align-items-center justify-content-center"
                style={{
                  width: '2rem',
                  height: '2rem',
                  background: '#6366f1',
                  borderRadius: '10px'
                }}
              >
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}>ET</span>
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  letterSpacing: '-0.02em',
                  color: isScrolled ? 'var(--ios-text)' : '#fff'
                }}
              >
                EaseTrain
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex align-items-center gap-1">
              {[
                { label: intl.formatMessage({ id: 'home.header.features' }), action: onScrollToFeatures },
                { label: intl.formatMessage({ id: 'home.header.pricing' }), action: onScrollToPricing },
                { label: intl.formatMessage({ id: 'home.header.contact' }), action: onScrollToContact }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    color: isScrolled ? 'var(--ios-text-secondary)' : 'rgba(255,255,255,0.9)',
                    transition: 'all 0.2s ease',
                    letterSpacing: '-0.01em'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex align-items-center gap-2">
              <button
                onClick={onLoginClick}
                className="hidden sm:inline-flex"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  color: isScrolled ? 'var(--ios-text-secondary)' : 'rgba(255,255,255,0.9)',
                  transition: 'all 0.2s ease'
                }}
              >
                {intl.formatMessage({ id: 'home.header.login' })}
              </button>
              <Button
                label={intl.formatMessage({ id: 'home.hero.getStarted' })}
                onClick={onSignUpClick}
                style={{
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.45rem 1rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 12px rgba(99, 102, 241, 0.25)'
                }}
              />
              <button
                className="md:hidden"
                onClick={() => setMobileMenuVisible(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  color: isScrolled ? 'var(--ios-text)' : '#fff',
                  fontSize: '1.1rem'
                }}
              >
                <i className="pi pi-bars" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <Sidebar
        visible={mobileMenuVisible}
        onHide={() => setMobileMenuVisible(false)}
        position="right"
        style={{
          width: '280px',
          background: 'var(--ios-glass-bg)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)'
        }}
      >
        <div className="flex flex-column gap-1 pt-2">
          {[
            { label: intl.formatMessage({ id: 'home.header.features' }), action: onScrollToFeatures },
            { label: intl.formatMessage({ id: 'home.header.pricing' }), action: onScrollToPricing },
            { label: intl.formatMessage({ id: 'home.header.contact' }), action: onScrollToContact }
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => handleMobileNav(item.action)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.7rem 0.85rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: 'var(--ios-text)',
                textAlign: 'left',
                transition: 'background 0.15s ease',
                width: '100%'
              }}
            >
              {item.label}
            </button>
          ))}

          <div style={{ height: '1px', background: 'var(--ios-divider)', margin: '0.5rem 0' }} />

          <button
            onClick={() => handleMobileNav(onLoginClick)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.7rem 0.85rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              fontWeight: 500,
              color: 'var(--ios-text)',
              textAlign: 'left',
              width: '100%'
            }}
          >
            {intl.formatMessage({ id: 'home.header.login' })}
          </button>

          <Button
            label={intl.formatMessage({ id: 'home.hero.getStarted' })}
            onClick={() => handleMobileNav(onSignUpClick)}
            style={{
              background: '#6366f1',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 600,
              marginTop: '0.25rem'
            }}
          />
        </div>
      </Sidebar>
    </>
  );
};

export default Header;
