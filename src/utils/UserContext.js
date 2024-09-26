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
  const [isLoading, setIsLoading] = useState(true);
  const { setLoading } = useSpinner();

  useEffect(() => {
    const checkEverything = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);

        const {valid} = await fetchUserData(decodedUser.userId)
        if(valid){
          
          if (decodedUser.userType === 'coach') {
            const data = await fetchCoachData(decodedUser.userId);
            setCoach(data)
          } else if (decodedUser.userType === 'client') {
            const data = await fetchClientData(decodedUser.userId);
            setClient(data)
          } else {
          }
        }else{
          localStorage.removeItem('token')
          setUser(null);
          setCoach(null);
          setClient(null);
        }
      } else {
        setUser(null);
        setCoach(null);
        setClient(null);
      }
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
        setIsLoading(false); 
      }

      
    }
    checkEverything();

    
  }, [setLoading]);

  const fetchUserData = async (userId) => {
    try {
      const data = await fetchUser(userId)
      // console.log('User:', data)
      return data
    } catch (error) {
      console.log(error);
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
    } 
  };

  return (
    <UserContext.Provider value={{ user, coach, client, setUser, setCoach, setClient, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};