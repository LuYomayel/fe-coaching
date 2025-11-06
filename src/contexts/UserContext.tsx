import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useSpinner } from '../utils/GlobalSpinner';
import { fetchClient, fetchCoach, fetchUser } from '../services/usersService';
import { UserContextValue, UserProviderProps } from 'types/contexts';
import { ICoach, IClient, IUser } from 'types/models';
import { JwtPayload } from 'types/auth/auth';

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [coach, setCoach] = useState<ICoach | null>(null);
  const [client, setClient] = useState<IClient | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const { setLoading } = useSpinner();

  useEffect(() => {
    const checkEverything = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (token) {
          const decodedUser = jwtDecode<JwtPayload>(token);
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
            setUser({
              id: decodedUser.userId,
              userId: decodedUser.userId,
              email: decodedUser.email,
              name: userData.name,
              userType: decodedUser.userType,
              verified: decodedUser.isVerified
            });

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

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCoach(null);
    setClient(null);
  };

  const fetchUserData = async (userId: number) => {
    try {
      const { data } = await fetchUser(userId);
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const fetchCoachData = async (userId: number) => {
    try {
      const { data } = await fetchCoach(userId);
      return data;
    } catch (error) {
      console.error('Error fetching coach data:', error);
      setCoach(null);
      throw error;
    }
  };

  const fetchClientData = async (userId: number) => {
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
    <UserContext.Provider value={{ user, coach, client, setUser, setCoach, setClient, isInitialized, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
