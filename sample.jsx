import React, { useState, useEffect, useMemo, useRef } from 'react';

function EnterpriseDashboard() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const inputRef = useRef(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => user.name.toLowerCase().includes(filter.toLowerCase()));
  }, [filter, users]);

  const stats = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
  }, [users]);

  const handleTabChange = (tab) => setActiveTab(tab);
  const handleSearch = (e) => setFilter(e.target.value);

  return (
    <div className="dashboard">
      <header>
        <h1>Enterprise Dashboard</h1>
        <input
          ref={inputRef}
          value={filter}
          onChange={handleSearch}
          placeholder="Search users..."
        />
        <div className="tabs">
          {['overview', 'users', 'analytics', 'settings'].map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main>
        {loading ? (
          <p>Loading data...</p>
        ) : (
          <>
            {activeTab === 'overview' && (
              <section>
                <h2>Overview</h2>
                <div className="cards">
                  {Object.entries(stats).map(([role, count]) => (
                    <div key={role} className="card">
                      <h3>{role}</h3>
                      <p>{count} users</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'users' && (
              <section>
                <h2>Users</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.role}</td>
                        <td>{user.active ? 'Active' : 'Inactive'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {activeTab === 'analytics' && (
              <section>
                <h2>Analytics</h2>
                <div className="charts">
                  {[...Array(5)].map((_, i) => (
                    <div className="chart" key={i}>
                      <h4>Chart {i + 1}</h4>
                      <canvas id={`chart-${i}`} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'settings' && (
              <section>
                <h2>Settings</h2>
                <form>
                  <label>
                    Admin Email
                    <input type="email" placeholder="admin@example.com" />
                  </label>
                  <label>
                    Enable Notifications
                    <input type="checkbox" />
                  </label>
                  <button type="submit">Save Settings</button>
                </form>
              </section>
            )}
          </>
        )}
      </main>

      <footer>
        <p>&copy; 2025 Enterprise Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default EnterpriseDashboard;
