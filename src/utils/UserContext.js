import React, { createContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
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
        fetch(`${apiUrl}/users/coach/${decodedUser.userId}`)
          .then(async (response) => {
            if (!response.ok) {
              setCoach(null);
            } else {
              const data = await response.json();
              setCoach(data);
            }
          })
          .catch(error => setCoach(null))
          .finally(() => setLoading(false));
      } else {
        fetch(`${apiUrl}/users/client/${decodedUser.userId}`)
          .then(async (response) => {
            if (!response.ok) {
              setClient(null);
            } else {
              const data = await response.json();
              setClient(data);
            }
          })
          .catch(error => setClient(null))
          .finally(() => setLoading(false));
      }
    } else {
      setUser(null);
      setCoach(null);
      setClient(null);
    }
  }, [setLoading]);

  return (
    <UserContext.Provider value={{ user, coach, client, setUser, setCoach, setClient }}>
      {children}
    </UserContext.Provider>
  );
};