import { RefObject } from 'react';
import { Card } from 'primereact/card';
import { useIntl, FormattedMessage } from 'react-intl';
import { Users, Dumbbell, LineChart, Video } from 'lucide-react';

export interface FeaturesProps {
  featuresRef: RefObject<HTMLDivElement | null>;
}
const Features = ({ featuresRef }: FeaturesProps) => {
  const intl = useIntl();

  const features = [
    {
      icon: <Users size={32} className="text-primary" />,
      title: intl.formatMessage({ id: 'home.features.manageClients' }),
      description: intl.formatMessage({
        id: 'home.features.manageClientsDesc'
      })
    },
    {
      icon: <Dumbbell size={32} className="text-primary" />,
      title: intl.formatMessage({ id: 'home.features.customPlans' }),
      description: intl.formatMessage({ id: 'home.features.customPlansDesc' })
    },
    {
      icon: <LineChart size={32} className="text-primary" />,
      title: intl.formatMessage({ id: 'home.features.trackProgress' }),
      description: intl.formatMessage({
        id: 'home.features.trackProgressDesc'
      })
    },
    {
      icon: <Video size={32} className="text-orange-500" />,
      title: intl.formatMessage({ id: 'home.features.videoTutorials' }),
      description: intl.formatMessage({
        id: 'home.features.videoTutorialsDesc'
      })
    }
  ];

  return (
    <div className="surface-section py-2 sm:py-2" ref={featuresRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-900 mb-4">
            <FormattedMessage id="home.features.title" />
          </h2>
          <p className="text-600 text-lg max-w-2xl mx-auto">
            <FormattedMessage id="home.features.subtitle" />
          </p>
        </div>

        <div className="flex flex-row gap-4 h-full">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group h-[20rem] hover:shadow-8 transition-all duration-300 hover:-translate-y-1 border-1 surface-border surface-card h-full w-full"
            >
              <div className="p-2">
                <div className="w-3rem h-3rem border-round-3xl bg-primary-50 flex align-items-center justify-content-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl text-left font-semibold text-900 mb-3">{feature.title}</h3>
                <p className="text-700 line-height-3">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Features;
