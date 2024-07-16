import React, { createContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
export const UserContext = createContext();
const apiUrl = process.env.REACT_APP_API_URL;
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [coach, setCoach] = useState(null);
  const [client, setClient] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);
      console.log(decodedUser, apiUrl)
      setCoach(null)
      setClient(null)
      if(decodedUser.userType === 'coach'){
        fetch(`${apiUrl}/users/coach/${decodedUser.userId}`)
          .then(async (response) => {
              if(!response.ok){
                setCoach(null)
              }else{
                const data = await response.json();
                setCoach(data)
              }
          })
          .catch(error => console.log(error));
      }else{
        fetch(`${apiUrl}/users/client/${decodedUser.userId}`)
          .then(async (response) => {
            if(!response.ok){
              setClient(null)
            }else{
              const data = await response.json();
              setClient(data)
            }
          })
          .catch(error => console.log(error));
      }
    }else{
      setUser(null)
      setCoach(null)
      setClient(null)
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, coach, client, setUser }}>
      {children}
    </UserContext.Provider>
  );
};