import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useSpinner } from './GlobalSpinner';

export const UserContext = createContext();
const apiUrl = process.env.REACT_APP_API_URL;

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [coach, setCoach] = useState(null);
  const [client, setClient] = useState(null);
  const { setLoading } = useSpinner();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);

      setLoading(true);
      if (decodedUser.userType === 'coach') {
        fetchCoachData(decodedUser.userId);
      } else if (decodedUser.userType === 'client') {
        fetchClientData(decodedUser.userId);
      } else {
        setLoading(false);
      }
    } else {
      setUser(null);
      setCoach(null);
      setClient(null);
    }
  }, []);

  const fetchCoachData = async (userId) => {
    try {
      const response = await fetch(`${apiUrl}/users/coach/${userId}`);
      if (!response.ok) {
        const dataResponse = await response.json();
        throw new Error(`${dataResponse.message}`);
      }
      const data = await response.json();
      setCoach(data);
    } catch (error) {
      console.log(error);
      setCoach(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientData = async (userId) => {
    try {
      const response = await fetch(`${apiUrl}/users/client/${userId}`);
      if (!response.ok) {
        const dataResponse = await response.json();
        throw new Error(`${dataResponse.message}`);
      }
      const data = await response.json();
      setClient(data);
    } catch (error) {
      console.log(error);
      setClient(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, coach, client, setUser, setCoach, setClient }}>
      {children}
    </UserContext.Provider>
  );
};