import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Qualify = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://www.outix.co/thirdparty/getAllResults/qualifying/SUPER_STREET?displaydate=2025-03-01', {
          headers: {
            'Auth-Token': 'UY_eAWHxXHT6Adb8OBIit0txV6SjHVFC3H_2_Em_hy0='
          }
        });
        if (!response.data.error) {
          setData(response.data.msg);
        } else {
          setError('Error fetching data');
        }
      } catch (err) {
        setError('Error fetching data');
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>QUALIFYING</h1>
      {data.map((round) => (
        <div key={round.id}>
          <h2>{round.Description} - Round {round.Round}</h2>
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Name</th>
                <th>Class</th>
                <th>Car Number</th>
                <th>Car Make</th>
                <th>Car Year</th>
                <th>RT</th>
                <th>ET</th>
                <th>Speed</th>
              </tr>
            </thead>
            <tbody>
              {round.results.map((result) => (
                <tr key={result.id}>
                  <td>{result.Position}</td>
                  <td>{result.Name}</td>
                  <td>{result.Class}</td>
                  <td>{result.Car_Number}</td>
                  <td>{result.Car_Make}</td>
                  <td>{result.Car_Year}</td>
                  <td>{result.RT}</td>
                  <td>{result.ET}</td>
                  <td>{result.Speed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default Qualify;