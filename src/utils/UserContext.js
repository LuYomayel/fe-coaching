import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useSpinner } from './GlobalSpinner';
import { fetchClient, fetchCoach, fetchUser } from '../services/usersService';

export const UserContext = createContext();
const apiUrl = process.env.REACT_APP_API_URL;

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [coach, setCoach] = useState(null);
  const [client, setClient] = useState(null);
  const { setLoading } = useSpinner();

  useEffect(() => {
    const checkEverything = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);

        const {valid} = await fetchUserData(token)
        if(valid){
          setLoading(true);
          if (decodedUser.userType === 'coach') {
            const data = await fetchCoachData(decodedUser.userId);
            setCoach(data)
          } else if (decodedUser.userType === 'client') {
            const data = await fetchClientData(decodedUser.userId);
            setClient(data)
          } else {
            setLoading(false);
          }
        }else{
          // localStorage.removeItem('token')
          setUser(null);
          setCoach(null);
          setClient(null);
        }
      } else {
        setUser(null);
        setCoach(null);
        setClient(null);
      }
    }
    checkEverything();

    
  }, []);

  const fetchUserData = async (token) => {
    try {
      const data = await fetchUser(token)
      console.log('User:', data)
      return data
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachData = async (userId) => {
    try {
      const data = await fetchCoach(userId)
      return data
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
      const data = await fetchClient(userId)
      return data
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