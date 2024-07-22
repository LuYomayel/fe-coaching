import React from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { Slider } from 'primereact/slider';
import { Dropdown } from 'primereact/dropdown';

const CustomInput = ({ type, id, value, onChange, disabled }) => {
  switch (type) {
    case 'number':
      return (
        <InputNumber
          id={id}
          value={value}
          onValueChange={onChange}
          min={0}
          max={5}
          className="exercise-feedback-input"
        />
      );
    case 'slider':
      return (
        <Slider
          id={id}
          value={value}
          onChange={onChange}
          min={0}
          max={5}
          className="exercise-feedback-input"
        />
      );
    case 'dropdown':
      const options = [
        { label: 'Very Easy', value: 1 },
        { label: 'Easy', value: 2 },
        { label: 'Moderate', value: 3 },
        { label: 'Hard', value: 4 },
        { label: 'Very Hard', value: 5 },
      ];
      return (
        <Dropdown
          id={id}
          value={value}
          options={options}
          onChange={onChange}
          className="exercise-feedback-input"
          placeholder="Select Difficulty"
          disabled={disabled}
        />
      );
    default:
      return null;
  }
};

export default CustomInput;