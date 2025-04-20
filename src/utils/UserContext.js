import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useSpinner } from './GlobalSpinner';
import { fetchClient, fetchCoach, fetchUser } from '../services/usersService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [coach, setCoach] = useState(null);
  const [client, setClient] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { setLoading } = useSpinner();

  useEffect(() => {
    const checkEverything = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (token) {
          const decodedUser = jwtDecode(token);
          const isTokenExpired = decodedUser.exp * 1000 < Date.now();

          if (isTokenExpired) {
            localStorage.removeItem('token');
            setUser(null);
            setCoach(null);
            setClient(null);
            setIsInitialized(true);
            return;
          }

          const userData = await fetchUserData(decodedUser.userId);

          if (decodedUser.isVerified && decodedUser.email === userData.email) {
            setUser(decodedUser);

            if (decodedUser.userType === 'coach') {
              const coachData = await fetchCoachData(decodedUser.userId);
              setCoach(coachData);
            } else if (decodedUser.userType === 'client') {
              const clientData = await fetchClientData(decodedUser.userId);
              setClient(clientData);
            }
          } else {
            localStorage.removeItem('token');
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
        console.error('Error initializing user context:', error);
        setUser(null);
        setCoach(null);
        setClient(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    checkEverything();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const { data } = await fetchUser(userId);
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const fetchCoachData = async (userId) => {
    try {
      const { data } = await fetchCoach(userId);
      return data;
    } catch (error) {
      console.error('Error fetching coach data:', error);
      setCoach(null);
      throw error;
    }
  };

  const fetchClientData = async (userId) => {
    try {
      const { data } = await fetchClient(userId);
      return data;
    } catch (error) {
      console.error('Error fetching client data:', error);
      setClient(null);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, coach, client, setUser, setCoach, setClient, isInitialized }}>
      {children}
    </UserContext.Provider>
  );
};
