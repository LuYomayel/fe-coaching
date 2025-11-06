import { TabView, TabPanel } from 'primereact/tabview';
import { useIntl } from 'react-intl';
import { TrainingSessionsTab } from '../../components/plans/TrainingSessionsTab';
import { TrainingCyclesTab } from '../../components/plans/TrainingCyclesTab';

export default function PlansPage() {
  const intl = useIntl();

  return (
    <div className="flex gap-4 w-full m-auto">
      <TabView className="w-full p-1">
        <TabPanel header={intl.formatMessage({ id: 'coach.sections.trainingSessions' })}>
          <TrainingSessionsTab />
        </TabPanel>
        <TabPanel header={intl.formatMessage({ id: 'coach.sections.trainingCycles' })}>
          <TrainingCyclesTab />
        </TabPanel>
      </TabView>
    </div>
  );
}
