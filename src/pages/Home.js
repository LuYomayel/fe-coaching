import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';  // Importar Toast

import { showError } from '../utils/toastMessages';  // Importar funciones
import '../styles/Home.css'
const apiUrl = process.env.REACT_APP_API_URL;

const CoachHome = () => {
  const [students, setStudents] = useState([]);
  const toast = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiUrl}/subscription/coach/1`)
      .then(response => response.json())
      .then(data => {
        setStudents(data)
      })
      .catch(error => showError(toast, 'Error fetching students'));
  }, []);

  const handleRowClick = (studentId) => {
    navigate(`/students/${studentId}/plans`);
  };

  const onRowSelect = (event) => {
    handleRowClick(event.data.client.id);
  };

  const handleNewPlan = () => {
    navigate('/plans/create')
  }

  return (
    <div>
      <Toast ref={toast} /> {/* Agregar Toast */}
      <h1>My Students</h1> 
        <Button label="Create New Plan" icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-primary create-plan-button" onClick={handleNewPlan }/>
      <DataTable value={students} paginator rows={10} selectionMode="single" onRowSelect={onRowSelect} className="my-students-container" >
        <Column field="client.user.name" header="Name" />
        <Column field="client.user.email" header="Email" />
        <Column field="client.fitnessGoal" header="Fitness Goal" />
        <Column field="client.activityLevel" header="Activity Level" />
      </DataTable>
    </div>
  );
};

export default CoachHome;