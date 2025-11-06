import { Button } from 'primereact/button';
import { FormattedMessage, useIntl } from 'react-intl';

export interface HeroProps {
  onSignUpClick: () => void;
  onScrollToFeatures: () => void;
}

const Hero = ({ onSignUpClick, onScrollToFeatures }: HeroProps) => {
  const intl = useIntl();
  return (
    <section className="hero-bg flex align-items-center justify-content-center overflow-hidden relative min-h-screen">
      {/* Background Image */}
      <div className="absolute top-0 left-0 w-full h-full z-1">
        <img src="/bg.png" alt="Fitness background" className="w-full h-full object-cover" />
        <div className="absolute top-0 left-0 w-full h-full bg-white opacity-80"></div>
      </div>

      <div className="relative z-2 max-w-7xl mx-auto px-4 py-8" style={{ paddingTop: '5rem' }}>
        <div className="grid lg:grid-cols-2 gap-6 align-items-center">
          {/* Left Content */}
          <div className="animate-fade-in-up">
            <h1 className="hero-title text-gray-900 mb-4 line-height-1 text-left">
              <FormattedMessage id="home.hero.transformYour" />
              <span className="block text-primary">
                <FormattedMessage id="home.hero.fitnessJourney" />
              </span>
              <FormattedMessage id="home.hero.withEaseTrain" />
            </h1>

            <p className="text-xl text-gray-600 mb-6 line-height-3 max-w-30rem">
              <FormattedMessage id="home.hero.subtitle" />
            </p>

            <div className="flex flex-column sm:flex-row gap-3 mb-6">
              <Button
                label={intl.formatMessage({ id: 'home.hero.getStarted' })}
                icon="pi pi-arrow-right"
                iconPos="right"
                className="p-button-lg p-button-primary"
                onClick={onSignUpClick}
              />
              <Button
                label={intl.formatMessage({ id: 'home.hero.watchDemo' })}
                icon="pi pi-play"
                className="p-button-lg p-button-outlined"
                onClick={onScrollToFeatures}
              />
            </div>

            <div className="flex align-items-center gap-4 text-sm text-gray-600">
              <div className="flex align-items-center">
                <i className="pi pi-check text-green-300 mr-1"></i>
                <FormattedMessage id="home.hero.easyToUse" />
              </div>
              <div className="flex align-items-center">
                <i className="pi pi-check text-green-300 mr-1"></i>
                <FormattedMessage id="home.hero.safeAndReliable" />
              </div>
              <div className="flex align-items-center">
                <i className="pi pi-check text-green-300 mr-1"></i>
                <FormattedMessage id="home.hero.support" />
              </div>
            </div>
          </div>

          {/* Right Content - Feature Preview */}
          <div className="animate-fade-in-up">
            <div className="surface-0 border-round-2xl p-5 shadow-8 border-1 surface-border bg-white">
              <div className="flex align-items-center justify-content-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  <FormattedMessage id="home.hero.customTrainingPlans" />
                </h3>
                <div className="w-3rem h-3rem bg-primary-100 border-round-3xl flex align-items-center justify-content-center">
                  <i className="pi pi-heart text-primary text-xl"></i>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                <FormattedMessage id="home.hero.customTrainingPlansDesc" />
              </p>

              <div className="flex flex-column gap-3">
                <div className="flex align-items-center p-3 surface-100 border-round-lg bg-gray-50">
                  <div className="w-2rem h-2rem bg-primary-100 border-round-3xl flex align-items-center justify-content-center mr-3">
                    <i className="pi pi-user text-primary"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    <FormattedMessage id="home.hero.feature1" />
                  </span>
                </div>

                <div className="flex align-items-center p-3 surface-100 border-round-lg bg-gray-50">
                  <div className="w-2rem h-2rem bg-secondary-100 border-round-3xl flex align-items-center justify-content-center mr-3">
                    <i className="pi pi-chart-line text-primary"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    <FormattedMessage id="home.hero.feature2" />
                  </span>
                </div>

                <div className="flex align-items-center p-3 surface-100 border-round-lg bg-gray-50">
                  <div className="w-2rem h-2rem bg-orange-100 border-round-3xl flex align-items-center justify-content-center mr-3">
                    <i className="pi pi-video text-orange-500"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    <FormattedMessage id="home.hero.feature3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
