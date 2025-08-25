import React from 'react';
import { Button } from 'primereact/button';
import { FormattedMessage } from 'react-intl';
import PWAInstallButton from '../PWAInstallButton';
import { Check } from 'lucide-react';

const Hero = ({ onSignUpClick, onScrollToFeatures }) => {
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
              Transform Your
              <span className="block text-primary">Fitness Journey</span>
              with EaseTrain
            </h1>

            <p className="text-xl text-gray-600 mb-6 line-height-3 max-w-30rem">
              Empower trainers, motivate clients, and achieve fitness goals together with our comprehensive platform
              designed for success.
            </p>

            <div className="flex flex-column sm:flex-row gap-3 mb-6">
              <Button
                label="Get Started Free"
                icon="pi pi-arrow-right"
                iconPos="right"
                className="p-button-lg p-button-primary"
                onClick={onSignUpClick}
              />
              <Button
                label="Watch Demo"
                icon="pi pi-play"
                className="p-button-lg p-button-outlined"
                onClick={onScrollToFeatures}
              />
            </div>

            <div className="flex align-items-center gap-4 text-sm text-gray-600">
              <div className="flex align-items-center">
                <i className="pi pi-check text-green-300 mr-1"></i>
                Easy to use
              </div>
              <div className="flex align-items-center">
                <i className="pi pi-check text-green-300 mr-1"></i>
                Safe and reliable
              </div>
              <div className="flex align-items-center">
                <i className="pi pi-check text-green-300 mr-1"></i>
                24/7 Support
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

              <div className="mt-4 pt-3 border-top-1 surface-border">
                <div className="flex align-items-center justify-content-between text-sm">
                  <span className="text-color-secondary">Trusted by</span>
                  <span className="font-semibold text-primary">1000+ Coaches</span>
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
