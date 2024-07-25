import React, { useContext, useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';


import { Calendar } from 'primereact/calendar';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Chart } from 'primereact/chart';
import { formatDate, getSeverity, sortBySessionDate, updateStatus } from '../utils/UtilFunctions';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { TabPanel, TabView } from 'primereact/tabview';
import '../styles/StudentProfile.css'
import { Tag } from 'primereact/tag';
import { useSpinner } from '../utils/GlobalSpinner';
const apiUrl = process.env.REACT_APP_API_URL;

const ClientProfile = () => {
  const { user } = useContext(UserContext);
  const showToast = useToast();
  const [personalInfo, setPersonalInfo] = useState({});
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [subscription, setSubscription] = useState({});
  const [workouts, setWorkouts] = useState([]);
  const [activities, setActivities] = useState([])
  const { showConfirmationDialog } = useConfirmationDialog();
  const [refreshKey, setRefreshKey] = useState(0)
  const { loading, setLoading } = useSpinner();
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'workout.planName': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    description: { operator: 'and', constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
});
  const [statuses] = useState(['current', 'expired', 'completed', 'pending']);
  
  const [progressData, setProgressData] = useState({
    labels: ['Completed', 'Pending'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['green', 'red'],
        hoverBackgroundColor: ['green', 'red']
      }
    ]
  });

  const fitnessGoals = [
    { label: 'Weight loss', value: 'weight loss'},
    { label: 'Muscle gain', value: 'muscle gain' },
    { label: 'Gain mobility', value: 'gain mobility' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Flexibility', value: 'flexibility' },
  ]
  const activityLevels = [
    { label: 'Sedentary', value: 'sedentary'},
    { label: 'Moderately active', value: 'moderately active' },
    { label: 'Very active', value: 'very active' },
  ]
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch personal information
        const personalInfoResponse = await fetch(`${apiUrl}/users/client/${user.userId}`);
        if (!personalInfoResponse.ok) {
          const errorData = await personalInfoResponse.json();
          throw new Error(errorData.message || 'Something went wrong.');
        }
        const personalInfoData = await personalInfoResponse.json();
        setPersonalInfo(personalInfoData);
        setActivityLevel(personalInfoData.activityLevel);
        const goals = personalInfoData.fitnessGoal.split(',')
        .map(goal => goal.trim()) // Eliminar espacios en blanco
        .filter((value, index, self) => self.indexOf(value) === index); // Eliminar duplicados

        setFitnessGoal(goals);
        // Fetch activities
        const activitiesResponse = await fetch(`${apiUrl}/users/userId/activities/${user.userId}`);
        if (!activitiesResponse.ok) {
          const errorData = await activitiesResponse.json();
          throw new Error(errorData.message || 'Something went wrong.');
        }
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData);

        // Fetch subscription details
        const subscriptionResponse = await fetch(`${apiUrl}/subscription/client-subscription/details/${user.userId}`);
        if (!subscriptionResponse.ok) {
          const errorData = await subscriptionResponse.json();
          throw new Error(errorData.message || 'Something went wrong');
        }
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData);

        const checkStatusWorkouts = updateStatus(subscriptionData.workoutInstances);
        const workoutsSorted = sortBySessionDate(checkStatusWorkouts);
        setWorkouts(workoutsSorted);

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
              hoverBackgroundColor: ['green', 'yellow', 'red', 'blue']
            }
          ]
        });

      } catch (error) {
        showToast('error', 'Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.userId, showToast, refreshKey]);

  const handleEditDialogOpen = () => {
    setEditDialogVisible(true);
  };

  const handleEditDialogClose = () => {
    setRefreshKey(old => old+1)
    setEditDialogVisible(false);
  };

  const handleSavePersonalInfo = async (body) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/users/client/${personalInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
    //   const data = await response.json();
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        throw new Error(errorData.message || 'Something went wrong');
      }
      else{
        showToast('success', 'Success', 'Student updated successfully');
        
      }
    } catch (error) {
      setLoading(false);
      showToast('error', 'Error', error.message);
    }finally{
      setLoading(false)
      setEditDialogVisible(false);
      setRefreshKey(old => old+1)
    }
    
  };

  const onClickSaveStudent = async () =>{
    const body = { fitnessGoal, activityLevel, phoneNumber: personalInfo.phoneNumber };
    // Validación para comprobar si algún valor es nulo
    for (const [key, value] of Object.entries(body)) {
      // console.log(value, key)
      if(key === 'fitnessGoal') {
        if(value.length === 0) 
          return showToast('error', 'Error', `${key} cannot be null or empty`);
      }
      if (value == null || value === '' || value === 0) {
        showToast('error', 'Error', `${key} cannot be null or empty`);
        return;
      }
    }
    showConfirmationDialog({
      message: "Are you sure you want to edit this student?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleSavePersonalInfo(body),
      reject: () => console.log('Rejected')
  });
  } 

  const setPlanDetails = (rowData) => {
    return (
      <p>Week {rowData.trainingSession.trainingWeek.weekNumber} - Day {rowData.trainingSession.dayNumber}</p>
    )
  }
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
            className="column-filter"
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
          className="column-filter"
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
      className="column-filter"
      style={{ minWidth: '12rem' }}
    />
  );
};



  
  // if(loading) return null;
  return (
    <div className="flex flex-column align-items-center justify-content-center w-11 mx-auto">
      <h1>Client Profile</h1>
      <div className="flex flex-column md:flex-row gap-2 justify-content-between w-full overflow-auto h-45">

        <div className='flex flex-column gap-3 w-full md:w-3'>
          <div className="">
            <Card title="Personal Information">
              <div className="p-field">
                <label htmlFor="name">Name:</label>
                <p id="name">{personalInfo?.name}</p>
              </div>
              <div className="p-field">
                <label htmlFor="email">Email:</label>
                <p id="email">{personalInfo?.user?.email}</p>
              </div>
              <div className="p-field">
                <label htmlFor="birthdate">Birthdate:</label>
                <p id="birthdate">{formatDate(personalInfo?.birthdate)}</p>
              </div>
              <div className="p-field">
                <label htmlFor="gender">Gender:</label>
                <p id="gender">{personalInfo?.gender}</p>
              </div>
              <div className="p-field">
                <label htmlFor="phone">Phone:</label>
                <p id="phone">{personalInfo?.phoneNumber}</p>
              </div>
              <Button label="Edit" icon="pi pi-pencil" className='p-button-rounded p-button-warning' onClick={handleEditDialogOpen} />
            </Card>
          </div>
          <div className="">
            <Card title="Current Subscription">
              <div className="p-field">
                <label htmlFor="planName">Plan Name:</label>
                <p id="planName">{subscription?.coachPlan?.name}</p>
              </div>
              <div className="p-field">
                <label htmlFor="startDate">Start Date:</label>
                <p id="startDate">{formatDate(subscription?.subscription?.startDate)}</p>
              </div>
              <div className="p-field">
                <label htmlFor="endDate">End Date:</label>
                <p id="endDate">{formatDate(subscription?.subscription?.endDate)}</p>
              </div>
              <div className="p-field">
                <label htmlFor="status">Status:</label>
                <p id="status">{subscription?.subscription?.status}</p>
              </div>
              {/* <Button label="Update Subscription" icon="pi pi-refresh" /> */}
            </Card>
          </div>
        </div>

        <div className='w-full md:w-8'>
          <TabView className='hola'>
            <TabPanel header="Workout History">
              <DataTable 
                value={workouts} 
                paginator 
                rows={6} 
                filters={filters} 
                globalFilterFields={['workout.planName', 'status']}
                onFilter={(e) => setFilters(e.filters)}
                emptyMessage="No workouts found."
              >
                <Column 
                  field="workout.planName" 
                  header="Plan Name" 
                  sortable 
                  filter 
                  filterPlaceholder="Search by name" 
                  filterElement={planNameFilterTemplate}
                  />
                <Column  header="Details"   body={setPlanDetails}/>
                <Column field="trainingSession.sessionDate" header="Training Date" body={(rowData) => formatDate(rowData.trainingSession.sessionDate)} sortable  />
                <Column field="realEndDate"header="Day Trained" body={(rowData) => formatDate(rowData.realEndDate)} sortable  />
                <Column field="status" header="Status" body={statusBodyTemplate} sortable filter filterElement={statusFilterTemplate}  />
                  {/* <Column body={viewActionButtons} header="Actions" /> */}
              </DataTable>
            </TabPanel>
            <TabPanel header="Progress">
              <Chart type="pie" data={progressData} width='20rem' height='20rem'/>
            </TabPanel>
            <TabPanel header="User historial" className=''>
              <DataTable 
              value={activities} 
              paginator 
              rows={10}
              rowsPerPageOptions={[10,25,50]}
              filters={filters}
              filterDisplay="menu"
              globalFilterFields={['description']}
              onFilter={(e) => setFilters(e.filters)}
              emptyMessage="No activities found."
              >
                <Column 
                  field="timestamp" 
                  header="Date" 
                  body={(rowData) => formatDate(rowData.timestamp)} 
                  sortable
                  filter
                  filterField="timestamp"
                  filterElement={(options) => (
                    <Calendar
                      value={options.value}
                      onChange={(e) => options.filterApplyCallback(e.value)}
                      dateFormat="yy-mm-dd"
                      placeholder="Select Date"
                      showIcon
                    />
                  )}
                  />
                <Column 
                  field="description" 
                  header="Action" 
                  sortable
                  filter
                  filterElement={descriptionFilterTemplate}
                  />
                  {/* <Column body={viewActionButtons} header="Actions" /> */}
              </DataTable>
              {/* <Timeline layout="horizontal" value={activities} opposite={(item) => item.description} 
                content={(item) => <small className="text-color-secondary">{formatDate(item.timestamp)}</small>} /> */}
            </TabPanel>
          </TabView>
        </div>
       
      </div>

      <Dialog header="Edit Personal Information" visible={editDialogVisible} className="responsive-dialog" style={{ width: '50vw' }} onHide={handleEditDialogClose}>
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="fitnessGoal">Fitness Goal</label>
            <MultiSelect id="fitnessGoal" options={fitnessGoals} value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} />
          </div>
          <div className="p-field">
            <label htmlFor="activityLevel">Activity Level</label>
            <Dropdown id="activityLevel" options={activityLevels} value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} />
          </div>
          <div className="p-field">
            <label htmlFor="editPhone">Phone</label>
            <InputText id="editPhone" value={personalInfo.phoneNumber} onChange={(e) => setPersonalInfo({ ...personalInfo, phoneNumber: e.target.value })} />
          </div>
        </div>
        <Button label="Save" icon="pi pi-check" onClick={onClickSaveStudent} loading={loading} />
      </Dialog>

    </div>
  );
};

export default ClientProfile;