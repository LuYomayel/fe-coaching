import { ProgressSpinner } from 'primereact/progressspinner';
import React from 'react';
// Import any necessary dependencies

// Define the Spinner component
const Spinner = () => {
    return (
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8"  animationDuration=".5s" />
    );
};

// Export the Spinner component as a global component
export default Spinner;
