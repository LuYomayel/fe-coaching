import { Button } from 'primereact/button';
import { FormattedMessage, useIntl } from 'react-intl';

export interface HeroProps {
  onSignUpClick: () => void;
  onScrollToFeatures: () => void;
}

const Hero = ({ onSignUpClick, onScrollToFeatures }: HeroProps) => {
  const intl = useIntl();
  return (
    <section
      className="flex align-items-center justify-content-center overflow-hidden relative"
      style={{ minHeight: '100vh' }}
    >
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full z-1">
        <img src="/bg.png" alt="Fitness background" className="w-full h-full" style={{ objectFit: 'cover' }} />
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(245,245,255,0.88) 50%, rgba(224,231,255,0.85) 100%)',
            backdropFilter: 'blur(2px)'
          }}
        />
      </div>

      <div
        className="relative z-2 w-full px-4 py-8"
        style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '6rem' }}
      >
        <div className="grid align-items-center">
          {/* Left Content */}
          <div className="col-12 lg:col-6 animate-fade-in-up">
            <h1
              className="mb-4 text-left"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                color: '#171717'
              }}
            >
              <FormattedMessage id="home.hero.transformYour" />
              <span className="block" style={{ color: '#6366f1' }}>
                <FormattedMessage id="home.hero.fitnessJourney" />
              </span>
              <FormattedMessage id="home.hero.withEaseTrain" />
            </h1>

            <p
              className="mb-5 text-left"
              style={{
                fontSize: '1.15rem',
                lineHeight: 1.7,
                color: '#525252',
                maxWidth: '28rem'
              }}
            >
              <FormattedMessage id="home.hero.subtitle" />
            </p>

            <div className="flex flex-column sm:flex-row gap-3 mb-5">
              <Button
                label={intl.formatMessage({ id: 'home.hero.getStarted' })}
                icon="pi pi-arrow-right"
                iconPos="right"
                className="p-button-lg"
                style={{
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '0.85rem 1.8rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
                }}
                onClick={onSignUpClick}
              />
              <Button
                label={intl.formatMessage({ id: 'home.hero.watchDemo' })}
                icon="pi pi-play"
                className="p-button-lg p-button-outlined"
                style={{
                  borderRadius: '14px',
                  padding: '0.85rem 1.8rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  borderColor: '#6366f1',
                  color: '#6366f1',
                  borderWidth: '1.5px'
                }}
                onClick={onScrollToFeatures}
              />
            </div>

            <div className="flex align-items-center gap-4" style={{ fontSize: '0.88rem', color: '#737373' }}>
              <div className="flex align-items-center gap-1">
                <i className="pi pi-check" style={{ color: '#22c55e', fontSize: '0.8rem' }} />
                <FormattedMessage id="home.hero.easyToUse" />
              </div>
              <div className="flex align-items-center gap-1">
                <i className="pi pi-check" style={{ color: '#22c55e', fontSize: '0.8rem' }} />
                <FormattedMessage id="home.hero.safeAndReliable" />
              </div>
              <div className="flex align-items-center gap-1">
                <i className="pi pi-check" style={{ color: '#22c55e', fontSize: '0.8rem' }} />
                <FormattedMessage id="home.hero.support" />
              </div>
            </div>
          </div>

          {/* Right Content - Feature Preview Card */}
          <div className="col-12 lg:col-6 animate-fade-in-up">
            <div
              style={{
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: '24px',
                padding: '2rem',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div className="flex align-items-center justify-content-between mb-4">
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#171717',
                    margin: 0
                  }}
                >
                  <FormattedMessage id="home.hero.customTrainingPlans" />
                </h3>
                <div
                  className="flex align-items-center justify-content-center"
                  style={{
                    width: '2.8rem',
                    height: '2.8rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '14px'
                  }}
                >
                  <i className="pi pi-heart" style={{ color: '#6366f1', fontSize: '1.2rem' }} />
                </div>
              </div>

              <p style={{ color: '#737373', marginBottom: '1.25rem', lineHeight: 1.6, fontSize: '0.92rem' }}>
                <FormattedMessage id="home.hero.customTrainingPlansDesc" />
              </p>

              <div className="flex flex-column gap-2">
                {[
                  {
                    icon: 'pi pi-user',
                    color: 'rgba(99, 102, 241, 0.1)',
                    iconColor: '#6366f1',
                    msgId: 'home.hero.feature1'
                  },
                  {
                    icon: 'pi pi-chart-line',
                    color: 'rgba(34, 197, 94, 0.1)',
                    iconColor: '#22c55e',
                    msgId: 'home.hero.feature2'
                  },
                  {
                    icon: 'pi pi-video',
                    color: 'rgba(249, 115, 22, 0.1)',
                    iconColor: '#f97316',
                    msgId: 'home.hero.feature3'
                  }
                ].map((feat, i) => (
                  <div
                    key={i}
                    className="flex align-items-center"
                    style={{
                      padding: '0.75rem 0.85rem',
                      background: 'rgba(0,0,0,0.02)',
                      borderRadius: '12px',
                      gap: '0.75rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      className="flex align-items-center justify-content-center"
                      style={{
                        width: '2rem',
                        height: '2rem',
                        background: feat.color,
                        borderRadius: '10px',
                        flexShrink: 0
                      }}
                    >
                      <i className={feat.icon} style={{ color: feat.iconColor, fontSize: '0.9rem' }} />
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#171717' }}>
                      <FormattedMessage id={feat.msgId} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
