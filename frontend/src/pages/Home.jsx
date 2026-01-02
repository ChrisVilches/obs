import { useState, useEffect } from 'react';

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then((json) => setData(json.message));
  }, []);

  return (
    <div>
      <h1>Home</h1>
      <p>API says: {data}</p>
      <img src="/uploads/logo-hr.png" alt="sample" width="100"/>
    </div>
  );
}
