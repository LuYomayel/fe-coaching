import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Chart } from 'primereact/chart';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Calendar } from 'primereact/calendar';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { FilterMatchMode, FilterOperator } from 'primereact/api';

import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { fetchClient, fetchClientActivitiesByUserId, updatePersonalInfo } from '../services/usersService';
import { fetchSubscriptionDetails } from '../services/subscriptionService';
import { formatDate, getSeverity, sortBySessionDate, updateStatus } from '../utils/UtilFunctions';

export default function NewClientProfile() {
  const { user } = useContext(UserContext);
  const showToast = useToast();
  const { showConfirmationDialog } = useConfirmationDialog();
  const { loading, setLoading } = useSpinner();
  const toast = useRef(null);

  // State variables
  const [personalInfo, setPersonalInfo] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [fitnessGoal, setFitnessGoal] = useState([]);
  const [activityLevel, setActivityLevel] = useState('');
  const [progressData, setProgressData] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'workout.planName': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    description: { operator: 'and', constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
  });
  const [statuses] = useState(['current', 'expired', 'completed', 'pending']);

  // Fetch data on component mount and when refreshKey changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch personal information
        const dataClient = await fetchClient(user.userId);
        setPersonalInfo(dataClient);
        setActivityLevel(dataClient.activityLevel);
        const goals = dataClient.fitnessGoal.split(',')
          .map(goal => goal.trim())
          .filter((value, index, self) => self.indexOf(value) === index);
        setFitnessGoal(goals);

        // Fetch activities
        const dataActivities = await fetchClientActivitiesByUserId(user.userId);
        setActivities(dataActivities);

        // Fetch subscription details
        const subscriptionData = await fetchSubscriptionDetails(user.userId);
        setSubscription(subscriptionData);

        const checkStatusWorkouts = updateStatus(subscriptionData.workoutInstances);
        const workoutsSorted = sortBySessionDate(checkStatusWorkouts);
        setWorkoutHistory(workoutsSorted);

        const completed = workoutsSorted.filter(workout => workout.status === 'completed').length;
        const pending = workoutsSorted.filter(workout => workout.status === 'pending').length;
        const expired = workoutsSorted.filter(workout => workout.status === 'expired').length;
        const current = workoutsSorted.filter(workout => workout.status === 'current').length;

        setProgressData({
          labels: ['Completed', 'Pending', 'Expired', 'Current'],
          datasets: [
            {
              data: [completed, pending, expired, current],
              backgroundColor: ['green', 'yellow', 'red', 'blue'],
              hoverBackgroundColor: ['green', 'yellow', 'red', 'blue'],
            },
          ],
        });
      } catch (error) {
        showToast('error', 'Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.userId, showToast, setLoading, refreshKey]);

  // Handlers
  const handleEditPersonalInfo = () => {
    setEditDialogVisible(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogVisible(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleSavePersonalInfo = async () => {
    const body = { fitnessGoal, activityLevel, phoneNumber: personalInfo.phoneNumber };
    // Validate inputs
    for (const [key, value] of Object.entries(body)) {
      if (key === 'fitnessGoal') {
        if (value.length === 0)
          return showToast('error', 'Error', `${key} cannot be null or empty`);
      }
      if (value == null || value === '' || value === 0) {
        showToast('error', 'Error', `${key} cannot be null or empty`);
        return;
      }
    }

    showConfirmationDialog({
      message: 'Are you sure you want to save these changes?',
      header: 'Confirm Save',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          setLoading(true);
          await updatePersonalInfo(personalInfo.id, body);
          showToast('success', 'Success', 'Personal information updated successfully');
          setEditDialogVisible(false);
          setRefreshKey(prev => prev + 1);
        } catch (error) {
          showToast('error', 'Error', error.message);
        } finally {
          setLoading(false);
        }
      },
      reject: () => {},
    });
  };

  // Templates for DataTable filters and cells
  const statusItemTemplate = (option) => {
    return <span>{option}</span>;
  };

  const statusBodyTemplate = (rowData) => {
    return <Tag value={rowData.status} severity={getSeverity(rowData.status)} />;
  };

  const statusFilterTemplate = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={statuses}
        onChange={(e) => options.filterApplyCallback(e.value)}
        itemTemplate={statusItemTemplate}
        placeholder="Select a Status"
        className="p-column-filter"
        showClear
        style={{ minWidth: '12rem' }}
      />
    );
  };

  const planNameFilterTemplate = (options) => {
    return (
      <InputText
        value={options.value}
        onChange={(e) => options.filterApplyCallback(e.target.value)}
        placeholder="Search by name"
        className="p-column-filter"
        style={{ minWidth: '12rem' }}
      />
    );
  };

  const descriptionFilterTemplate = (options) => {
    return (
      <InputText
        value={options.value}
        onChange={(e) => options.filterApplyCallback(e.target.value)}
        placeholder="Search by description"
        className="p-column-filter"
        style={{ minWidth: '12rem' }}
      />
    );
  };

  const dateFilterTemplate = (options) => {
    return (
      <Calendar
        value={options.value}
        onChange={(e) => options.filterApplyCallback(e.value)}
        dateFormat="yy-mm-dd"
        placeholder="Select Date"
        showIcon
        style={{ minWidth: '12rem' }}
      />
    );
  };

  const setPlanDetails = (rowData) => {
    return (
      <p>
        Week {rowData.trainingSession.trainingWeek.weekNumber} - Day {rowData.trainingSession.dayNumber}
      </p>
    );
  };

  return (
    <div className="client-profile p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <h1 className="text-4xl font-bold mb-4">Client Profile</h1>

      <div className="grid">
        {/* Personal Information */}
        <div className="col-12 md:col-4">
          <Card title="Personal Information" className="mb-4">
            <p>
              <strong>Name:</strong> {personalInfo?.name}
            </p>
            <p>
              <strong>Email:</strong> {personalInfo?.user?.email}
            </p>
            <p>
              <strong>Birthdate:</strong> {formatDate(personalInfo?.birthdate)}
            </p>
            <p>
              <strong>Gender:</strong> {personalInfo?.gender}
            </p>
            <p>
              <strong>Phone:</strong> {personalInfo?.phoneNumber}
            </p>
            <Button
              label="Edit"
              icon="pi pi-pencil"
              className="p-button-rounded p-button-warning mt-3"
              onClick={handleEditPersonalInfo}
            />
          </Card>

          {/* Current Subscription */}
          <Card title="Current Subscription" className="mb-4">
            <p>
              <strong>Plan Name:</strong> {subscription?.coachPlan?.name}
            </p>
            <p>
              <strong>Start Date:</strong> {formatDate(subscription?.subscription?.startDate)}
            </p>
            <p>
              <strong>End Date:</strong> {formatDate(subscription?.subscription?.endDate)}
            </p>
            <p>
              <strong>Status:</strong> {subscription?.subscription?.status}
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="col-12 md:col-8">
          <TabView>
            {/* Workout History */}
            <TabPanel header="Workout History">
              <DataTable
                value={workoutHistory}
                paginator
                rows={6}
                filters={filters}
                globalFilterFields={['workout.planName', 'status']}
                onFilter={(e) => setFilters(e.filters)}
                emptyMessage="No workouts found."
                responsiveLayout="scroll"
              >
                <Column
                  field="workout.planName"
                  header="Plan Name"
                  sortable
                  filter
                  filterPlaceholder="Search by name"
                  filterElement={planNameFilterTemplate}
                />
                <Column header="Details" body={setPlanDetails} />
                <Column
                  field="trainingSession.sessionDate"
                  header="Training Date"
                  body={(rowData) => formatDate(rowData.trainingSession.sessionDate)}
                  sortable
                  filter
                  filterField="trainingSession.sessionDate"
                  filterElement={dateFilterTemplate}
                />
                <Column
                  field="realEndDate"
                  header="Day Trained"
                  body={(rowData) => formatDate(rowData.realEndDate)}
                  sortable
                  filter
                  filterField="realEndDate"
                  filterElement={dateFilterTemplate}
                />
                <Column
                  field="status"
                  header="Status"
                  body={statusBodyTemplate}
                  sortable
                  filter
                  filterElement={statusFilterTemplate}
                />
              </DataTable>
            </TabPanel>

            {/* Progress */}
            <TabPanel header="Progress">
              <div className="flex justify-content-center">
                <Chart type="pie" data={progressData} options={{ responsive: true }} style={{ width: '50%' }} />
              </div>
            </TabPanel>

            {/* User Historical Activities */}
            <TabPanel header="User Historical Activities">
              <DataTable
                value={activities}
                paginator
                rows={8}
                rowsPerPageOptions={[8, 25, 50]}
                filters={filters}
                filterDisplay="menu"
                globalFilterFields={['description']}
                onFilter={(e) => setFilters(e.filters)}
                emptyMessage="No activities found."
                responsiveLayout="scroll"
              >
                <Column
                  field="timestamp"
                  header="Date"
                  body={(rowData) => formatDate(rowData.timestamp)}
                  sortable
                  filter
                  filterField="timestamp"
                  filterElement={dateFilterTemplate}
                />
                <Column
                  field="description"
                  header="Action"
                  sortable
                  filter
                  filterElement={descriptionFilterTemplate}
                />
              </DataTable>
            </TabPanel>
          </TabView>
        </div>
      </div>

      {/* Edit Personal Information Dialog */}
      <Dialog
        header="Edit Personal Information"
        visible={editDialogVisible}
        style={{ width: '50vw' }}
        onHide={handleEditDialogClose}
        footer={
          <div>
            <Button label="Cancel" icon="pi pi-times" onClick={handleEditDialogClose} className="p-button-text" />
            <Button label="Save" icon="pi pi-check" onClick={handleSavePersonalInfo} autoFocus />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="fitnessGoal">Fitness Goal</label>
            <MultiSelect
              id="fitnessGoal"
              options={[
                { label: 'Weight loss', value: 'weight loss' },
                { label: 'Muscle gain', value: 'muscle gain' },
                { label: 'Gain mobility', value: 'gain mobility' },
                { label: 'Maintenance', value: 'maintenance' },
                { label: 'Flexibility', value: 'flexibility' },
              ]}
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.value)}
              placeholder="Select Fitness Goals"
            />
          </div>
          <div className="p-field">
            <label htmlFor="activityLevel">Activity Level</label>
            <Dropdown
              id="activityLevel"
              options={[
                { label: 'Sedentary', value: 'sedentary' },
                { label: 'Moderately active', value: 'moderately active' },
                { label: 'Very active', value: 'very active' },
              ]}
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.value)}
              placeholder="Select Activity Level"
            />
          </div>
          <div className="p-field">
            <label htmlFor="editPhone">Phone</label>
            <InputNumber
              maxLength={11}
              id="editPhone"
              useGrouping={false}
              value={personalInfo?.phoneNumber}
              onChange={(e) => setPersonalInfo({ ...personalInfo, phoneNumber: e.value })}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}