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

  const navTextClass = 'p-button-text text-white hover:text-gray-300 transition-colors';
  const logoTextClass = 'font-bold text-xl text-white';

  const handleMobileNav = (action: () => void) => {
    setMobileMenuVisible(false);
    action();
  };

  console.log('isScrolled', isScrolled);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-5 transition-all duration-300"
        style={
          isScrolled
            ? {
                backgroundColor: '#1e293b',
                borderBottom: '2px solid var(--primary-color)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.6)'
              }
            : { backgroundColor: 'transparent' }
        }
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1400px' }}>
          <div className="flex align-items-center justify-content-between h-4rem">
            <div className="flex align-items-center gap-2">
              <div className="w-2rem h-2rem bg-primary border-round-lg flex align-items-center justify-content-center">
                <span className="text-0 font-bold text-sm">ET</span>
              </div>
              <span className={logoTextClass}>EaseTrain</span>
            </div>

            <nav className="hidden md:flex align-items-center gap-8">
              <Button
                label={intl.formatMessage({ id: 'home.header.features' })}
                className={navTextClass}
                onClick={onScrollToFeatures}
              />
              <Button
                label={intl.formatMessage({ id: 'home.header.pricing' })}
                className={navTextClass}
                onClick={onScrollToPricing}
              />
              <Button
                label={intl.formatMessage({ id: 'home.header.contact' })}
                className={navTextClass}
                onClick={onScrollToContact}
              />
            </nav>

            <div className="flex align-items-center gap-2 sm:gap-4">
              <Button
                label={intl.formatMessage({ id: 'home.header.login' })}
                className={`${navTextClass} hidden sm:inline-flex`}
                onClick={onLoginClick}
              />
              <Button
                label={intl.formatMessage({ id: 'home.hero.getStarted' })}
                className="bg-primary hover:bg-primary-600 text-0 border-none shadow-2 animate-pulse-glow"
                onClick={onSignUpClick}
              />
              <Button
                icon="pi pi-bars"
                className={`md:hidden ${navTextClass}`}
                onClick={() => setMobileMenuVisible(true)}
              />
            </div>
          </div>
        </div>
      </header>

      <Sidebar
        visible={mobileMenuVisible}
        onHide={() => setMobileMenuVisible(false)}
        position="right"
        className="w-18rem"
      >
        <div className="flex flex-column gap-2">
          <Button
            label={intl.formatMessage({ id: 'home.header.features' })}
            className="p-button-text text-left"
            onClick={() => handleMobileNav(onScrollToFeatures)}
          />
          <Button
            label={intl.formatMessage({ id: 'home.header.pricing' })}
            className="p-button-text text-left"
            onClick={() => handleMobileNav(onScrollToPricing)}
          />
          <Button
            label={intl.formatMessage({ id: 'home.header.contact' })}
            className="p-button-text text-left"
            onClick={() => handleMobileNav(onScrollToContact)}
          />
          <hr className="my-2" />
          <Button
            label={intl.formatMessage({ id: 'home.header.login' })}
            className="p-button-text text-left"
            onClick={() => handleMobileNav(onLoginClick)}
          />
          <Button
            label={intl.formatMessage({ id: 'home.hero.getStarted' })}
            className="bg-primary text-0 border-none"
            onClick={() => handleMobileNav(onSignUpClick)}
          />
        </div>
      </Sidebar>
    </>
  );
};

export default Header;
