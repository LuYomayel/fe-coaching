import React from 'react';
import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';

const Header = ({
  isScrolled,
  onLoginClick,
  onSignUpClick,
  onScrollToFeatures,
  onScrollToPricing,
  onScrollToContact
}) => {
  const intl = useIntl();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-5 transition-all duration-300 ${
        isScrolled ? 'surface-card shadow-2 backdrop-blur-sm border-bottom-1 surface-border' : 'bg-transparent'
      }`}
    >
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1400px' }}>
        <div className="flex align-items-center justify-content-between h-4rem">
          <div className="flex align-items-center gap-2">
            <div className="w-2rem h-2rem bg-primary border-round-lg flex align-items-center justify-content-center">
              <span className="text-0 font-bold text-sm">ET</span>
            </div>
            <span className="font-bold text-xl text-900">EaseTrain</span>
          </div>

          <nav className="hidden md:flex align-items-center gap-8">
            <Button
              label={intl.formatMessage({ id: 'home.header.features' })}
              className="p-button-text text-600 hover:text-900 transition-colors"
              onClick={onScrollToFeatures}
            />
            <Button
              label={intl.formatMessage({ id: 'home.header.pricing' })}
              className="p-button-text text-600 hover:text-900 transition-colors"
              onClick={onScrollToPricing}
            />
            <Button
              label={intl.formatMessage({ id: 'home.header.contact' })}
              className="p-button-text text-600 hover:text-900 transition-colors"
              onClick={onScrollToContact}
            />
          </nav>

          <div className="flex align-items-center gap-4">
            <Button
              label={intl.formatMessage({ id: 'home.header.login' })}
              className="p-button-text hidden sm:inline-flex text-600 hover:text-900"
              onClick={onLoginClick}
            />
            <Button
              label={intl.formatMessage({ id: 'home.hero.getStarted' })}
              className="bg-primary hover:bg-primary-600 text-0 border-none shadow-2  animate-pulse-glow"
              onClick={onSignUpClick}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
