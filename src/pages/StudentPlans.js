import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { showError } from '../utils/toastMessages';

const apiUrl = process.env.REACT_APP_API_URL;

const StudentPlans = () => {
  const { studentId } = useParams();
  const [plans, setPlans] = useState([]);
  const toast = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiUrl}/workout/clientId/${studentId}`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setPlans(data);
      })
      .catch(error => showError(toast, 'Error fetching plans'));
  }, [studentId]);

  const handleBack = () => {
    navigate('/'); // Adjust this path to your home route
  };

  const handleRowClick = (planId) => {
    navigate(`/plans/edit/${planId}/${studentId}`);
  };

  const onRowSelect = (event) => {
    console.log(event.data.id)
    handleRowClick(event.data.id);
  };

  return (
    <div>
      <Toast ref={toast} />
      <h1>Student Plans</h1>
      <Button label="Back" icon="pi pi-arrow-left" onClick={handleBack} />
      <DataTable value={plans} paginator rows={10} selectionMode="single" onRowSelect={onRowSelect}>
        <Column field="planName" header="Plan Name" />
        <Column field="startDate" header="Start Date" />
        <Column field="endDate" header="End Date" />
        <Column field="details" header="Details" />
      </DataTable>
    </div>
  );
};

export default StudentPlans;