'use client';
import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useSpinner } from './GlobalSpinner';
import { fetchClient, fetchCoach, fetchUser } from '../services/usersService';
import { authService } from '../services/authService';
import { ICoach, IClient, ICustomJwtPayload, UserContextType, UserProviderProps } from '../types/shared-types';

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<ICustomJwtPayload | null>(null);
  const [coach, setCoach] = useState<ICoach | null>(null);
  const [client, setClient] = useState<IClient | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const { setLoading } = useSpinner();

  const fetchUserData = useCallback(async (userId: string): Promise<any> => {
    try {
      const { data } = await fetchUser(userId);
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }, []);

  const fetchCoachData = useCallback(async (userId: string): Promise<ICoach> => {
    try {
      const { data } = await fetchCoach(userId);
      return data;
    } catch (error) {
      console.error('Error fetching coach data:', error);
      setCoach(null);
      throw error;
    }
  }, []);

  const fetchClientData = useCallback(async (userId: string): Promise<IClient> => {
    try {
      const { data } = await fetchClient(userId);
      return data;
    } catch (error) {
      console.error('Error fetching client data:', error);
      setClient(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    const checkEverything = async () => {
      try {
        setLoading(true);
        const token = authService.getToken();
        if (token) {
          const decodedUser = jwtDecode<ICustomJwtPayload>(token);
          const isTokenExpired = decodedUser.exp && decodedUser.exp * 1000 < Date.now();

          if (isTokenExpired) {
            authService.removeToken();
            setUser(null);
            setCoach(null);
            setClient(null);
            setIsInitialized(true);
            return;
          }
          const userData = await fetchUserData(decodedUser.userId);
          if (decodedUser.isVerified && decodedUser.email === userData.email) {
            setUser({
              userId: decodedUser.userId,
              email: decodedUser.email,
              userType: decodedUser.userType,
              isVerified: decodedUser.isVerified,
              exp: decodedUser.exp || 0,
              name: decodedUser.name
            });

            if (decodedUser.userType === 'coach') {
              const coachData = await fetchCoachData(decodedUser.userId);
              setCoach(coachData);
            } else if (decodedUser.userType === 'client') {
              const clientData = await fetchClientData(decodedUser.userId);
              setClient(clientData);
            }
          } else {
            authService.removeToken();
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

    if (!isInitialized) {
      checkEverything();
    }
  }, [fetchUserData, fetchCoachData, fetchClientData, isInitialized]); // Removed setLoading to prevent infinite loop

  return (
    <UserContext.Provider value={{ user, coach, client, setUser, setCoach, setClient, isInitialized }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook de utilidad
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
