import { RefObject } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { Users, Dumbbell, LineChart, Video } from 'lucide-react';

export interface FeaturesProps {
  featuresRef: RefObject<HTMLDivElement | null>;
}

const Features = ({ featuresRef }: FeaturesProps) => {
  const intl = useIntl();

  const features = [
    {
      icon: <Users size={24} />,
      iconColor: '#6366f1',
      iconBg: 'rgba(99, 102, 241, 0.1)',
      title: intl.formatMessage({ id: 'home.features.manageClients' }),
      description: intl.formatMessage({ id: 'home.features.manageClientsDesc' })
    },
    {
      icon: <Dumbbell size={24} />,
      iconColor: '#22c55e',
      iconBg: 'rgba(34, 197, 94, 0.1)',
      title: intl.formatMessage({ id: 'home.features.customPlans' }),
      description: intl.formatMessage({ id: 'home.features.customPlansDesc' })
    },
    {
      icon: <LineChart size={24} />,
      iconColor: '#3b82f6',
      iconBg: 'rgba(59, 130, 246, 0.1)',
      title: intl.formatMessage({ id: 'home.features.trackProgress' }),
      description: intl.formatMessage({ id: 'home.features.trackProgressDesc' })
    },
    {
      icon: <Video size={24} />,
      iconColor: '#f97316',
      iconBg: 'rgba(249, 115, 22, 0.1)',
      title: intl.formatMessage({ id: 'home.features.videoTutorials' }),
      description: intl.formatMessage({ id: 'home.features.videoTutorialsDesc' })
    }
  ];

  return (
    <div ref={featuresRef} style={{ padding: '2.5rem 0 2rem' }}>
      <div className="px-3 sm:px-6" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="text-center mb-6">
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--ios-text)',
              marginBottom: '0.75rem'
            }}
          >
            <FormattedMessage id="home.features.title" />
          </h2>
          <p
            style={{
              color: 'var(--ios-text-secondary)',
              fontSize: '1.05rem',
              maxWidth: '32rem',
              margin: '0 auto',
              lineHeight: 1.6
            }}
          >
            <FormattedMessage id="home.features.subtitle" />
          </p>
        </div>

        <div className="grid">
          {features.map((feature, index) => (
            <div key={index} className="col-12 sm:col-6 lg:col-3 p-2">
              <div
                style={{
                  background: 'var(--ios-glass-bg)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: '20px',
                  padding: '1.75rem',
                  border: '1px solid var(--ios-card-border)',
                  boxShadow: 'var(--ios-card-shadow)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  height: '100%',
                  cursor: 'default'
                }}
              >
                <div
                  className="flex align-items-center justify-content-center mb-4"
                  style={{
                    width: '3rem',
                    height: '3rem',
                    background: feature.iconBg,
                    borderRadius: '14px',
                    color: feature.iconColor
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    letterSpacing: '-0.015em',
                    color: 'var(--ios-text)',
                    marginBottom: '0.5rem',
                    textAlign: 'left'
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--ios-text-secondary)', lineHeight: 1.6, fontSize: '0.9rem', margin: 0 }}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
