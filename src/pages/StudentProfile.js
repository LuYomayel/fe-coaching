import React, { useContext, useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Chart } from 'primereact/chart';
import { formatDate } from '../utils/UtilFunctions';
import { Timeline } from 'primereact/timeline';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { TabPanel, TabView } from 'primereact/tabview';
import '../styles/StudentProfile.css'
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
  const [loading, setLoading] = useState(false);
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
    // Fetch personal information
    setLoading(true)
    fetch(`${apiUrl}/users/client/${user.userId}`)
      .then(async (response) => {
        if(!response.ok){
          const errorData = await response.json();
          setLoading(false)
          throw new Error(errorData.message || 'Something went wrong.')
        }
        const data= await response.json();
        setPersonalInfo(data)
        setActivityLevel(data.activityLevel);
        setFitnessGoal([data.fitnessGoal]);
        setLoading(false)
      })
      .catch(error => showToast('error', 'Error', error.message))
      .finally(() => setLoading(true))
    // Fetch activities
    fetch(`${apiUrl}/users/userId/activities/${user.userId}`)
      .then(async (response) => {
        if(!response.ok){
          const errorData = await response.json();
          setLoading(false)
          throw new Error(errorData.message || 'Something went wrong.')
        }
        const data= await response.json();
        
        setActivities(old => [...old, ...data])
        setActivities(old => [...old, ...data])
        setActivities(old => [...old, ...data])
        
        setLoading(false)
      })
      .catch(error => showToast('error', 'Error', error.message))
      .finally(() => setLoading(true))

    // Fetch subscription details
    setLoading(true)
    fetch(`${apiUrl}/subscription/client-subscription/details/${user.userId}`)
      .then(async (response) => {
        if(!response.ok){
          const errorData = await response.json();
          setLoading(true)
          throw new Error(errorData.message || 'Something went wrong')
        }
        const data = await response.json();
        console.log('Subscription: ', data)
        setSubscription(data)
        setLoading(false)
      })
      .catch(error => showToast('error', 'Error', error.message))
      .finally(() => setLoading(false))

      fetch(`${apiUrl}/workout/userId/${user.userId}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData)
          throw new Error(errorData.message || 'Something went wrong');
        }
        return response.json()
      })
      .then(data => {
        const mappedData = data.filter(data => data.groups.length > 0);
        setWorkouts(mappedData);
        const completed = mappedData.filter(workout => workout.status === 'completed').length;
        const pending = mappedData.filter(workout => workout.status === 'pending').length;

        setProgressData({
          labels: ['Completed', 'Pending'],
          datasets: [
            {
              data: [completed, pending],
              backgroundColor: ['green', 'red'],
              hoverBackgroundColor: ['green', 'red']
            }
          ]
        });
      })
      .catch(error => showToast('error', 'Error', error.message));
  }, [user.userId, showToast, refreshKey]);

  const handleEditDialogOpen = () => {
    setEditDialogVisible(true);
  };

  const handleEditDialogClose = () => {
    setRefreshKey(old => old+1)
    setEditDialogVisible(false);
  };

  const handleSavePersonalInfo = async (body) => {
    setLoading(true);
    try {
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
        setLoading(false);
        showToast('success', 'Success', 'Student updated successfully');
        setEditDialogVisible(false);
        setRefreshKey(old => old+1)
      }
    } catch (error) {
      setLoading(false);
      showToast('error', 'Error', error.message);
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

  // if(loading) return null;
  return (
    <div className="flex flex-column align-items-center justify-content-center w-11 mx-auto">
      <h1>Client Profile</h1>
      <div className="flex flex-row gap-2 justify-content-between w-full">

        <div className=' flex flex-column gap-3'>
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
              <Button label="Edit" icon="pi pi-pencil" onClick={handleEditDialogOpen} />
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

        <div className='w-10'>
          <TabView className='hola'>
            <TabPanel header="Workout History">
              <DataTable value={workouts} paginator rows={5}>
                  <Column field="workout.planName" header="Plan Name" />
                  <Column field="instanceName" header="Instance Name" />
                  <Column field="expectedStartDate" header="Start Date" body={(rowData) => formatDate(rowData.expectedStartDate)} />
                  <Column field="expectedEndDate" header="End Date" body={(rowData) => formatDate(rowData.expectedEndDate)} />
                  <Column field="status" header="Status" />
                  {/* <Column body={viewActionButtons} header="Actions" /> */}
              </DataTable>
            </TabPanel>
            <TabPanel header="Progress">
              <Chart type="pie" data={progressData} width='20rem' height='20rem'/>
            </TabPanel>
            <TabPanel header="User historial" className=''>
              <DataTable value={activities} paginator rows={5}>
                <Column field="timestamp" header="Date" body={(rowData) => formatDate(rowData.timestamp)} />
                <Column field="description" header="Action" />
                  {/* <Column body={viewActionButtons} header="Actions" /> */}
              </DataTable>
              {/* <Timeline layout="horizontal" value={activities} opposite={(item) => item.description} 
                content={(item) => <small className="text-color-secondary">{formatDate(item.timestamp)}</small>} /> */}
            </TabPanel>
          </TabView>
        </div>
       
      </div>

      <Dialog header="Edit Personal Information" visible={editDialogVisible} style={{ width: '50vw' }} onHide={handleEditDialogClose}>
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
        <Button label="Save" icon="pi pi-check" onClick={onClickSaveStudent} />
      </Dialog>

    </div>
  );
};

export default ClientProfile;