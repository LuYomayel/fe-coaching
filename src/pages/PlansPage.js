import React, { useState, useContext, useEffect } from 'react';
import { Card } from 'primereact/card';
import Spinner from '../utils/LittleSpinner';
import { FormattedMessage } from 'react-intl';
import { Button } from 'primereact/button';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import { fetchCoachWorkouts, deleteWorkoutPlan } from '../services/workoutService';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
export default function PlansPage() {
    const [workouts, setWorkouts] = useState([]);
    const intl = useIntl();
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [refreshKey, setRefreshKey] = useState(0);
    const { setLoading, isLoading } = useSpinner();
    const { showConfirmationDialog } = useConfirmationDialog();
    const showToast = useToast();

    useEffect(() => {
        fetchWorkoutPlans();
        // eslint-disable-next-line
    }, [refreshKey]);

    const fetchWorkoutPlans = async () => {
        setLoading(true);
        const response = await fetchCoachWorkouts(user.userId);
        if(response.message === 'success') {
            console.log(response.data);
            setWorkouts(response.data);
        } else {
            showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), response.message);
        }
        setLoading(false);
    }

    const handleDelete = async (workoutInstanceTemplateId) => {
        showConfirmationDialog({
          message: intl.formatMessage({ id: 'coach.delete.confirmation' }),
          header: intl.formatMessage({ id: 'coach.delete.header' }),
          icon: 'pi pi-exclamation-triangle',
          accept: async () => {
            try {
              await deleteWorkoutPlan(workoutInstanceTemplateId, true);
              setRefreshKey(prev => prev + 1);
            } catch (error) {
              console.error('Error deleting workout plan:', error.message);
              
              if(error.message === 'ER_ROW_IS_REFERENCED_2') {
                showToast('error', intl.formatMessage({ id: 'coach.delete.error.referenced' }), intl.formatMessage({ id: 'coach.delete.error.referenced.detail' }));
              } else {
                showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), error.message);
              }
            }
          },
          reject: () => {
            // Manejar el rechazo si es necesario
          }
    
        });
      }

    const statusTemplate = (rowData) => {
        const workoutInstanceTemplate = rowData.workoutInstances.find(w => w.isTemplate === true);
        return (
            <div>
                <Button label={intl.formatMessage({ id: 'common.edit' })} icon="pi pi-pencil" className="p-button-secondary" onClick={() => navigate(`/plans/edit/${workoutInstanceTemplate.id}`)} />
                <Button label={intl.formatMessage({ id: 'common.delete' })} icon="pi pi-trash" className="p-button-danger" onClick={() => handleDelete(workoutInstanceTemplate.id)} />
            </div>
        )
        
    };

    return <div>
        <Card className={isLoading ? 'flex justify-content-center mb-4' : 'mb-4'} >
                {isLoading ? <Spinner /> :
                    <>
                        <h2 className="text-2xl font-bold mb-3">
                            <FormattedMessage id="coach.sections.trainingPlans" />
                        </h2>
                        <div className="grid">
                            {workouts.map((plan, index) => (
                                <div key={index} className="col-12 md:col-4">
                                    <Card title={plan.planName} className="mb-3">
                                        {statusTemplate(plan)}
                                    </Card>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-content-end gap-2">
                            <Button label={intl.formatMessage({ id: 'coach.buttons.newPlan' })} icon="pi pi-plus" className="p-button-rounded p-button-lg p-button-primary" onClick={() => navigate('/plans/create')} />
                        </div>
                    </>
                }
            </Card>
    </div>;
};