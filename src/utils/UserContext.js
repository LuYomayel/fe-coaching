import React, { createContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import {useSpinner} from './GlobalSpinner'

export const UserContext = createContext();
const apiUrl = process.env.REACT_APP_API_URL;

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [coach, setCoach] = useState(null);
  const [client, setClient] = useState(null);
  const { setLoading } = useSpinner();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);

        setLoading(true);
        if (decodedUser.userType === 'coach') {
          try {
            const response = await fetch(`${apiUrl}/users/coach/${decodedUser.userId}`);
            if (!response.ok) {
              const dataResponse = await response.json();
              throw new Error(`${dataResponse.message}`);
            }
            const data = await response.json();
            setCoach(data);
          } catch (error) {
            console.log(error.message);
            if(error.message === 'User not found'){
              console.log('Entre aca')
              setUser(null)
              localStorage.removeItem('token')
            }
            setCoach(null);
          } finally {
            setLoading(false);
          }
        } else {
          try {
            const response = await fetch(`${apiUrl}/users/client/${decodedUser.userId}`);
            if (!response.ok) {
              const dataResponse = await response.json();
              throw new Error(`${dataResponse.message}`);
            }
            const data = await response.json();
            setClient(data);
          } catch (error) {
            if(error.message === 'User not found'){
              console.log('Entre aca')
              setUser(null)
              localStorage.removeItem('token')
            }
            setClient(null);
          } finally {
            setLoading(false);
          }
        }
      } else {
        setUser(null);
        setCoach(null);
        setClient(null);
      }
    };

    fetchData();
  }, [setLoading]);


  return (
    <UserContext.Provider value={{ user, coach, client, setUser, setCoach, setClient }}>
      {children}
    </UserContext.Provider>
  );
};